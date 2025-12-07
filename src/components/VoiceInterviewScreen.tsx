import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, Briefcase, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey } from "@/lib/storage";
import { InterviewConfig, InterviewStyle } from "@/lib/constants";
import { buildInterviewPrompt, getInterviewVoice } from "@/lib/prompts";
import { AudioRecorder, encodeAudioForAPI, AudioPlayer } from "@/lib/audio";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type SpeakingState = "idle" | "user" | "ai";

interface VoiceInterviewScreenProps {
  config: InterviewConfig;
  style: InterviewStyle;
  onEndInterview: (messages: Message[], duration: number) => void;
}

export function VoiceInterviewScreen({ config, style, onEndInterview }: VoiceInterviewScreenProps) {
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
                instructions: buildInterviewPrompt(config, style),
                voice: getInterviewVoice(style),
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

            // Interviewer speaks first - introduce themselves
            ws.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: "[The interview is starting. Introduce yourself warmly and begin. Tell them your name and role at the company.]",
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
  }, [apiKey, config, style, saveAssistantMessage]);

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

  const handleEndInterview = () => {
    disconnect();
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

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "connected":
        if (speakingState === "ai") return `${config.interviewerName} is speaking...`;
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
            status === "connected" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === "connected" ? "bg-success" : "bg-muted-foreground"
            )} />
            {getStatusText()}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Interviewer Avatar */}
          <div className="relative">
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center text-4xl font-semibold mx-auto transition-all duration-300",
              speakingState === "ai" 
                ? "bg-gradient-to-br from-purple-500/30 to-purple-500/10 ring-4 ring-purple-500/50 scale-110" 
                : "bg-gradient-to-br from-primary/30 to-primary/10"
            )}>
              {getInitials(config.interviewerName)}
            </div>
            {speakingState === "ai" && (
              <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/20" />
            )}
          </div>

          {/* Interviewer Info */}
          <div>
            <h2 className="text-2xl font-semibold">{config.interviewerName}</h2>
            <p className="text-muted-foreground">{config.interviewerTitle}</p>
            <p className="text-sm text-muted-foreground">{config.companyName}</p>
          </div>

          {/* Role */}
          <div className="glass-card px-4 py-2 inline-flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-sm">{config.roleName}</span>
          </div>

          {/* Microphone Status */}
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300",
            speakingState === "user"
              ? "bg-success/20 ring-4 ring-success/50"
              : status === "connected"
              ? "bg-secondary"
              : "bg-muted"
          )}>
            {status === "connecting" ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : speakingState === "user" ? (
              <Mic className="w-8 h-8 text-success" />
            ) : (
              <MicOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {status === "connecting" && "Setting up the interview..."}
            {status === "connected" && speakingState === "idle" && "Speak when ready"}
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
                  {messages[messages.length - 1].role === "user" ? "You" : config.interviewerName}:
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
