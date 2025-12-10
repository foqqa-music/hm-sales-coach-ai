import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, Target, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey } from "@/lib/storage";
import { buildTongTongPrompt, SCENARIO_PRODUCTS } from "@/lib/prompts";
import { AudioRecorder, encodeAudioForAPI, AudioPlayer } from "@/lib/audio";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type SpeakingState = "idle" | "user" | "ai";

interface MockDiscoveryVoiceScreenProps {
  scenario: typeof SCENARIO_PRODUCTS[0];
  onEndCall: (messages: Message[], duration: number) => void;
}

export function MockDiscoveryVoiceScreen({ scenario, onEndCall }: MockDiscoveryVoiceScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [speakingState, setSpeakingState] = useState<SpeakingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  
  const startTimeRef = useRef<number>(Date.now());
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentTranscriptRef = useRef<string>("");
  const pendingAssistantMessageRef = useRef<boolean>(false);

  const apiKey = getApiKey() || "";
  const systemPrompt = buildTongTongPrompt(scenario);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  const saveAssistantMessage = useCallback(() => {
    if (currentTranscriptRef.current.trim()) {
      const content = currentTranscriptRef.current.trim();
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      currentTranscriptRef.current = "";
      pendingAssistantMessageRef.current = false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        ["realtime", `openai-insecure-api-key.${apiKey}`, "openai-beta.realtime-v1"]
      );

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data.type);

        switch (data.type) {
          case "session.created":
            const sessionUpdate = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: systemPrompt,
                voice: "sage", // Balanced, professional voice
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 700,
                },
              },
            };
            ws.send(JSON.stringify(sessionUpdate));
            break;

          case "session.updated":
            setStatus("connected");
            playerRef.current = new AudioPlayer();
            recorderRef.current = new AudioRecorder((audioData) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "input_audio_buffer.append",
                    audio: encodeAudioForAPI(audioData),
                  })
                );
              }
            });
            await recorderRef.current.start();

            // Tong-Tong opens the call with scenario brief
            ws.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: `[Start the session by giving them the scenario brief, then wait for them to begin. Say something like: "Alright, here's your scenario: You're selling ${scenario.name} — ${scenario.description.toLowerCase()}. I'm Tong-Tong Li, GTM Engineering Manager at Clay. You've got 30 minutes to run discovery on me. Ready when you are." Then STOP and wait for them to start the call.]`,
                    },
                  ],
                },
              })
            );
            ws.send(JSON.stringify({ type: "response.create" }));
            break;

          case "input_audio_buffer.speech_started":
            setSpeakingState("user");
            if (pendingAssistantMessageRef.current) {
              saveAssistantMessage();
            }
            break;

          case "input_audio_buffer.speech_stopped":
            setSpeakingState("idle");
            break;

          case "conversation.item.input_audio_transcription.completed":
            if (data.transcript) {
              setMessages((prev) => [...prev, { role: "user", content: data.transcript }]);
            }
            break;

          case "response.audio.delta":
            setSpeakingState("ai");
            pendingAssistantMessageRef.current = true;
            if (data.delta) {
              playerRef.current?.addToQueue(data.delta);
            }
            break;

          case "response.audio.done":
            setSpeakingState("idle");
            break;

          case "response.audio_transcript.delta":
            if (data.delta) {
              currentTranscriptRef.current += data.delta;
            }
            break;

          case "response.audio_transcript.done":
            if (data.transcript) {
              currentTranscriptRef.current = data.transcript;
            }
            saveAssistantMessage();
            break;

          case "response.done":
            if (pendingAssistantMessageRef.current && currentTranscriptRef.current.trim()) {
              saveAssistantMessage();
            }
            break;

          case "error":
            console.error("WebSocket error:", data.error);
            setStatus("error");
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        if (currentTranscriptRef.current.trim()) {
          saveAssistantMessage();
        }
        setStatus("disconnected");
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect:", error);
      setStatus("error");
    }
  }, [apiKey, systemPrompt, saveAssistantMessage]);

  const disconnect = useCallback(() => {
    if (currentTranscriptRef.current.trim()) {
      saveAssistantMessage();
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    playerRef.current?.stop();
    playerRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
    setSpeakingState("idle");
  }, [saveAssistantMessage]);

  const handleEndCall = () => {
    disconnect();
    onEndCall(messages, elapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "connected":
        if (speakingState === "ai") return "Tong-Tong is speaking...";
        if (speakingState === "user") return "Listening to you...";
        return "Ready";
      case "error":
        return "Connection error";
      default:
        return "Disconnected";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-mono text-lg tabular-nums">{formatTime(elapsed)}</div>
          <div className={cn(
            "flex items-center gap-2 text-xs px-2 py-1 rounded-full",
            status === "connected" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
          )}>
            <Target className="w-3 h-3" />
            {getStatusText()}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Tong-Tong Avatar */}
          <div className="relative">
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center text-4xl font-semibold mx-auto transition-all duration-300",
              speakingState === "ai" 
                ? "bg-gradient-to-br from-green-500/30 to-green-500/10 ring-4 ring-green-500/50 scale-110" 
                : "bg-gradient-to-br from-green-500/20 to-green-500/5"
            )}>
              <span className="text-green-400">TT</span>
            </div>
            {speakingState === "ai" && (
              <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
            )}
          </div>

          {/* Interviewer Info */}
          <div>
            <h2 className="text-2xl font-semibold">Tong-Tong Li</h2>
            <p className="text-muted-foreground">GTM Engineer Manager</p>
            <p className="text-sm text-muted-foreground">Clay</p>
          </div>

          {/* Mock Discovery Badge */}
          <div className="glass-card px-4 py-2 inline-flex items-center gap-2 border-green-500/20">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm">{scenario.name}</span>
          </div>

          {/* Microphone Status */}
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300",
            speakingState === "user"
              ? "bg-green-500/20 ring-4 ring-green-500/50"
              : status === "connected"
              ? "bg-secondary"
              : "bg-muted"
          )}>
            {status === "connecting" ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : speakingState === "user" ? (
              <Mic className="w-8 h-8 text-green-500" />
            ) : (
              <MicOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {status === "connecting" && "Setting up the mock discovery..."}
            {status === "connected" && speakingState === "idle" && "Run your discovery"}
            {status === "connected" && speakingState === "user" && "Listening..."}
            {status === "connected" && speakingState === "ai" && ""}
            {status === "error" && "Connection failed. Please try again."}
          </p>

          {/* Live Transcript Preview */}
          {messages.length > 0 && (
            <div className="max-w-md mx-auto glass-card p-4 text-left max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Latest</p>
              <p className="text-sm">
                <span className="font-medium">
                  {messages[messages.length - 1].role === "user" ? "You" : "Tong-Tong"}:
                </span>{" "}
                {messages[messages.length - 1].content.slice(0, 150)}
                {messages[messages.length - 1].content.length > 150 && "..."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
