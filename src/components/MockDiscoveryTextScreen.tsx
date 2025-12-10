import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey } from "@/lib/storage";
import { buildTongTongPrompt, SCENARIO_PRODUCTS } from "@/lib/prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MockDiscoveryTextScreenProps {
  scenario: typeof SCENARIO_PRODUCTS[0];
  onEndCall: (messages: Message[], duration: number) => void;
}

export function MockDiscoveryTextScreen({ scenario, onEndCall }: MockDiscoveryTextScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const apiKey = getApiKey() || "";
  const systemPrompt = buildTongTongPrompt(scenario);

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

  // Tong-Tong opens the mock discovery
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      getAIResponse([]);
    }
  }, []);

  const getAIResponse = async (currentMessages: Message[]) => {
    setIsLoading(true);
    
    try {
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
            // Opening instruction if no messages yet
            ...(currentMessages.length === 0 ? [{
              role: "user" as const,
              content: `[Give the scenario brief: "Alright, here's your scenario: You're selling ${scenario.name} — ${scenario.description.toLowerCase()}. I'm Tong-Tong Li, GTM Engineering Manager at Clay. You've got 30 minutes to run discovery on me. Ready when you are." Then STOP. Do not say anything else. Do not ask how they want to start. Do not say "what can I help you with". Just wait in silence for them to begin.]`
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
          <div className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
            <Target className="w-3 h-3" />
            {scenario.name}
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleEndCall}
          className="gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End Session
        </Button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Loading for opening */}
          {messages.length === 0 && isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-2xl font-semibold mx-auto mb-4 text-green-400">
                TT
              </div>
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Tong-Tong is joining...</p>
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
              <div className={cn("flex items-start gap-2 max-w-[80%]", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-xs font-semibold text-green-400 shrink-0">
                    TT
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 animate-fade-in",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-xs font-semibold text-green-400 shrink-0">
                  TT
                </div>
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
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
              placeholder="Run your discovery..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-green-600 hover:bg-green-700"
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
