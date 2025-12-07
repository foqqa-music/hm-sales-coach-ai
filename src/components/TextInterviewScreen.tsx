import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send, Loader2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey } from "@/lib/storage";
import { InterviewConfig, InterviewStyle } from "@/lib/constants";
import { buildInterviewPrompt } from "@/lib/prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TextInterviewScreenProps {
  config: InterviewConfig;
  style: InterviewStyle;
  onEndInterview: (messages: Message[], duration: number) => void;
}

export function TextInterviewScreen({ config, style, onEndInterview }: TextInterviewScreenProps) {
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

  // Interviewer speaks first
  useEffect(() => {
    if (messages.length === 0) {
      getAIResponse([]);
    }
  }, []);

  const getAIResponse = async (currentMessages: Message[]) => {
    setIsLoading(true);
    
    try {
      const systemPrompt = buildInterviewPrompt(config, style);
      
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
            // If opening the interview
            ...(currentMessages.length === 0 ? [{
              role: "user" as const,
              content: "[The interview is starting. Introduce yourself warmly and begin the interview. Remember to tell them your name and role.]"
            }] : [])
          ],
          max_tokens: 500,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || "Let me rephrase that...";
      
      setMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, let me try that again..." }]);
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

  const handleEndInterview = () => {
    onEndInterview(messages, elapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-mono text-lg tabular-nums">{formatTime(elapsed)}</div>
          <div className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            <Briefcase className="w-3 h-3" />
            Interview
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleEndInterview}
          className="gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End Interview
        </Button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Loading for interview opening */}
          {messages.length === 0 && isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                {getInitials(config.interviewerName)}
              </div>
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>{config.interviewerName} is joining...</p>
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
                {msg.role === "assistant" && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    {config.interviewerName}
                  </p>
                )}
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
              placeholder="Type your response..."
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
