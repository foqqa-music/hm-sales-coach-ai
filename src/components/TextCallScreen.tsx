import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey } from "@/lib/storage";
import { CallType, TemperamentLevel, PROSPECT } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TextCallScreenProps {
  callType: CallType;
  temperament: TemperamentLevel;
  onEndCall: (messages: Message[], duration: number) => void;
}

// Extra instruction to prevent guided questions in text mode
const TEXT_MODE_INSTRUCTION = `

## CRITICAL RULE: DON'T HELP THEM DRIVE THE BUSINESS CONVERSATION

You can be natural and conversational in small talk - asking "how about you?" after they ask about your weekend is fine. That's normal human reciprocity.

BUT you must NEVER ask questions that help them with the SALES/BUSINESS part of the conversation:

BANNED - BUSINESS GUIDING QUESTIONS (never say these):
- "So, what can you tell me about Clay?"
- "What brings you to call today?"
- "What did you want to discuss?"
- "How can I help you?"
- "What are you guys trying to solve?"
- "Tell me more about what you do"
- "What's on the agenda?"
- "So what's this call about?"
- Any question that helps them transition from small talk to business
- Any question that does their discovery job for them

ALLOWED - NATURAL SMALL TALK (these are fine):
- "How about you?" after they ask about your weekend
- "Where are you based?" as casual curiosity
- "Oh nice, how long have you been there?" (casual follow-up)

THE KEY DISTINCTION:
- Social reciprocity in small talk = OK
- Helping them drive the sales conversation = NOT OK

When small talk naturally ends, just wait. Don't ask "So what can you tell me about Clay?" - that's THEIR job to transition to business. If there's awkward silence after small talk, that's their problem to solve.

EXAMPLES:

✅ OK: "It was good, pretty relaxed. How about you?" (social reciprocity)
✅ OK: "San Francisco. Where are you based?" (casual curiosity)
❌ NOT OK: "Nice, New York. So, what can you tell me about Clay?" (helping them transition)
❌ NOT OK: "Cool. So what brings you to call today?" (doing their job)
❌ NOT OK: After small talk ends: "Anyway, what did you want to discuss?" (guiding)

If they share something about themselves and don't move to business, just acknowledge it:
- They say "I'm in New York" → "Oh nice." (then wait for THEM to transition)
- Small talk wraps up → Stay silent. Let THEM pivot to business.

You're a busy VP who's polite in small talk but isn't going to help them figure out how to sell to you.`;



export function TextCallScreen({ callType, temperament, onEndCall }: TextCallScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiKey = getApiKey() || "";

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  // Cold call: AI speaks first
  useEffect(() => {
    if (callType === "cold" && messages.length === 0) {
      getAIResponse([]);
    }
  }, []);

  const getAIResponse = async (currentMessages: Message[]) => {
    setIsLoading(true);
    
    try {
      const systemPrompt = buildSystemPrompt(callType, temperament) + TEXT_MODE_INSTRUCTION;
      
      // Check if user's last message was short (for additional context)
      const lastUserMessage = currentMessages.filter(m => m.role === "user").pop();
      const wasShort = lastUserMessage && lastUserMessage.content.split(" ").length <= 5;
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...currentMessages.map(m => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content
            })),
            // For cold call opening, add instruction
            ...(currentMessages.length === 0 && callType === "cold" ? [{
              role: "user" as const,
              content: "[The phone is ringing. Answer it naturally - confused or slightly annoyed that someone is calling. Keep it short, like 'Yeah?' or 'This is Sam, who's this?']"
            }] : []),
            // If last message was very short, remind not to ask questions
            ...(wasShort ? [{
              role: "system" as const,
              content: "[Remember: Their message was short. Do NOT ask a follow-up question. Just acknowledge briefly or wait. It's their job to drive this conversation.]"
            }] : [])
          ],
          max_tokens: 500,
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || "...";
      
      setMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    await getAIResponse(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndCall = () => {
    onEndCall(messages, elapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-mono text-lg tabular-nums">{formatTime(elapsed)}</div>
          <div className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-success/10 text-success">
            <div className="w-2 h-2 rounded-full bg-success" />
            Text Mode
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleEndCall}
          className="gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End Call
        </Button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Intro message for discovery calls */}
          {callType === "discovery" && messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                {PROSPECT.initials}
              </div>
              <p className="font-medium text-foreground">{PROSPECT.name}</p>
              <p className="text-sm">{PROSPECT.title} at {PROSPECT.company}</p>
              <p className="mt-4">You booked this meeting. Start the conversation.</p>
            </div>
          )}

          {/* Loading for cold call opening */}
          {callType === "cold" && messages.length === 0 && isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Sam is answering the phone...</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 animate-fade-in",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
