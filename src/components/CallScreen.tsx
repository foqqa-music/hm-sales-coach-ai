import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeChat, Message, ConnectionStatus, SpeakingState } from "@/hooks/useRealtimeChat";
import { getApiKey } from "@/lib/storage";
import { CallType, TemperamentLevel, PROSPECT } from "@/lib/constants";

interface CallScreenProps {
  callType: CallType;
  temperament: TemperamentLevel;
  onEndCall: (messages: Message[], duration: number) => void;
}

export function CallScreen({ callType, temperament, onEndCall }: CallScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const transcriptRef = useRef<HTMLDivElement>(null);

  const apiKey = getApiKey() || "";

  const { messages, status, speakingState, connect, disconnect } = useRealtimeChat({
    apiKey,
    callType,
    temperament,
  });

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const handleEndCall = () => {
    disconnect();
    onEndCall(messages, elapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusLabel = () => {
    switch (speakingState) {
      case "ai":
        return "Sam is speaking...";
      case "user":
        return "You're speaking...";
      default:
        return "Listening...";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-mono text-lg tabular-nums">{formatTime(elapsed)}</div>
          <ConnectionIndicator status={status} />
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Avatar & Visualization */}
        <div className="relative mb-8">
          {/* Outer rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-300",
              speakingState === "ai" && "scale-110 border-primary/40 pulse-ring"
            )}
            style={{ margin: "-16px" }}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full border border-primary/10 transition-all duration-500",
              speakingState === "ai" && "scale-125 border-primary/20"
            )}
            style={{ margin: "-32px" }}
          />

          {/* Avatar */}
          <div
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center text-3xl font-semibold transition-all duration-300",
              speakingState === "ai"
                ? "bg-primary/20 speaking-animation"
                : speakingState === "user"
                ? "bg-success/20 ring-2 ring-success/50"
                : "bg-secondary listening-animation"
            )}
          >
            {PROSPECT.initials}
          </div>
        </div>

        {/* Status Label */}
        <p className="text-muted-foreground mb-2">{getStatusLabel()}</p>
        <p className="text-lg font-medium">{PROSPECT.name}</p>
      </main>

      {/* Transcript */}
      <div className="border-t border-border/50 bg-card/50">
        <div
          ref={transcriptRef}
          className="h-64 overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 && status === "connected" && (
            <p className="text-center text-muted-foreground text-sm">
              {callType === "cold"
                ? "Sam is answering the phone..."
                : "Start speaking when you're ready..."}
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "text-sm animate-fade-in",
                msg.role === "user" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="font-medium uppercase text-xs tracking-wide mr-2">
                {msg.role === "user" ? "You" : "Sam"}:
              </span>
              {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const isConnected = status === "connected";
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs px-2 py-1 rounded-full",
        isConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          Connected
        </>
      ) : status === "connecting" ? (
        <>
          <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
          Connecting...
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          Disconnected
        </>
      )}
    </div>
  );
}
