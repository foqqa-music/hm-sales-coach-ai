import { useState, useRef, useCallback, useEffect } from "react";
import { AudioRecorder, encodeAudioForAPI, AudioPlayer } from "@/lib/audio";
import { buildSystemPrompt, getVoice } from "@/lib/prompts";
import { CallType, TemperamentLevel } from "@/lib/constants";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export type SpeakingState = "idle" | "user" | "ai";

interface UseRealtimeChatProps {
  apiKey: string;
  callType: CallType;
  temperament: TemperamentLevel;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onSpeakingChange?: (state: SpeakingState) => void;
}

export function useRealtimeChat({
  apiKey,
  callType,
  temperament,
  onConnectionChange,
  onSpeakingChange,
}: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [speakingState, setSpeakingState] = useState<SpeakingState>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentTranscriptRef = useRef<string>("");
  const userTranscriptRef = useRef<string>("");
  const pendingAssistantMessageRef = useRef<boolean>(false);

  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onConnectionChange?.(newStatus);
    },
    [onConnectionChange]
  );

  const updateSpeaking = useCallback(
    (state: SpeakingState) => {
      setSpeakingState(state);
      onSpeakingChange?.(state);
    },
    [onSpeakingChange]
  );

  // Helper to save assistant message
  const saveAssistantMessage = useCallback(() => {
    if (currentTranscriptRef.current.trim()) {
      const content = currentTranscriptRef.current.trim();
      console.log("Saving assistant message:", content);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      currentTranscriptRef.current = "";
      pendingAssistantMessageRef.current = false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateStatus("connecting");

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
            // Send session update with our configuration
            const sessionUpdate = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: buildSystemPrompt(callType, temperament),
                voice: getVoice(temperament),
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
            updateStatus("connected");
            // Start recording
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

            // For cold calls, trigger AI to speak first
            if (callType === "cold") {
              ws.send(
                JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "message",
                    role: "user",
                    content: [
                      {
                        type: "input_text",
                        text: "[Phone rings. Answer the phone confused/annoyed. Say something like 'Yeah? Who's this?' Keep it under 5 words.]",
                      },
                    ],
                  },
                })
              );
              ws.send(JSON.stringify({ type: "response.create" }));
            }
            break;

          case "input_audio_buffer.speech_started":
            updateSpeaking("user");
            // If there's a pending assistant message, save it now
            if (pendingAssistantMessageRef.current) {
              saveAssistantMessage();
            }
            break;

          case "input_audio_buffer.speech_stopped":
            updateSpeaking("idle");
            break;

          case "conversation.item.input_audio_transcription.completed":
            if (data.transcript) {
              console.log("User transcript:", data.transcript);
              setMessages((prev) => [...prev, { role: "user", content: data.transcript }]);
            }
            break;

          case "response.audio.delta":
            updateSpeaking("ai");
            pendingAssistantMessageRef.current = true;
            if (data.delta) {
              playerRef.current?.addToQueue(data.delta);
            }
            break;

          case "response.audio.done":
            updateSpeaking("idle");
            break;

          case "response.audio_transcript.delta":
            if (data.delta) {
              currentTranscriptRef.current += data.delta;
              console.log("Transcript delta:", data.delta);
            }
            break;

          case "response.audio_transcript.done":
            console.log("Transcript done, full:", data.transcript || currentTranscriptRef.current);
            // Use the full transcript from the event if available, otherwise use accumulated
            if (data.transcript) {
              currentTranscriptRef.current = data.transcript;
            }
            saveAssistantMessage();
            break;

          case "response.done":
            // Backup: save any pending transcript when response completes
            if (pendingAssistantMessageRef.current && currentTranscriptRef.current.trim()) {
              console.log("Backup save on response.done");
              saveAssistantMessage();
            }
            break;

          case "response.text.delta":
            // Also capture text deltas as backup
            if (data.delta) {
              currentTranscriptRef.current += data.delta;
            }
            break;

          case "response.text.done":
            // Backup for text responses
            if (data.text && !currentTranscriptRef.current) {
              currentTranscriptRef.current = data.text;
              saveAssistantMessage();
            }
            break;

          case "error":
            console.error("WebSocket error:", data.error);
            updateStatus("error");
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateStatus("error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        // Save any pending message before closing
        if (currentTranscriptRef.current.trim()) {
          saveAssistantMessage();
        }
        updateStatus("disconnected");
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect:", error);
      updateStatus("error");
    }
  }, [apiKey, callType, temperament, updateStatus, updateSpeaking, saveAssistantMessage]);

  const disconnect = useCallback(() => {
    // Save any pending transcript before disconnecting
    if (currentTranscriptRef.current.trim()) {
      saveAssistantMessage();
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    playerRef.current?.stop();
    playerRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    updateStatus("disconnected");
    updateSpeaking("idle");
  }, [updateStatus, updateSpeaking, saveAssistantMessage]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    status,
    speakingState,
    connect,
    disconnect,
  };
}
