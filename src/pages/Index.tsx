import { useState, useEffect } from "react";
import { ApiKeyScreen } from "@/components/ApiKeyScreen";
import { ModeSelector } from "@/components/ModeSelector";
import { SetupScreen } from "@/components/SetupScreen";
import { CallScreen } from "@/components/CallScreen";
import { TextCallScreen } from "@/components/TextCallScreen";
import { FeedbackScreen } from "@/components/FeedbackScreen";
import { HiringManagerSetup } from "@/components/HiringManagerSetup";
import { TextInterviewScreen } from "@/components/TextInterviewScreen";
import { VoiceInterviewScreen } from "@/components/VoiceInterviewScreen";
import { InterviewFeedbackScreen } from "@/components/InterviewFeedbackScreen";
import { MockDiscoverySetup, MockDiscoveryConfig } from "@/components/MockDiscoverySetup";
import { MockDiscoveryTextScreen } from "@/components/MockDiscoveryTextScreen";
import { MockDiscoveryVoiceScreen } from "@/components/MockDiscoveryVoiceScreen";
import { MockDiscoveryFeedbackScreen } from "@/components/MockDiscoveryFeedbackScreen";
import { getApiKey } from "@/lib/storage";
import { 
  CallType, 
  TemperamentLevel, 
  InputMode, 
  PracticeMode,
  InterviewConfig,
  InterviewStyle 
} from "@/lib/constants";
import { Message } from "@/hooks/useRealtimeChat";

type Screen = 
  | "api-key" 
  | "mode-select"
  | "sales-setup" 
  | "sales-call" 
  | "sales-feedback"
  | "interview-setup"
  | "interview-call"
  | "interview-feedback"
  | "mock-discovery-setup"
  | "mock-discovery-call"
  | "mock-discovery-feedback";

interface SalesConfig {
  callType: CallType;
  temperament: TemperamentLevel;
  inputMode: InputMode;
}

interface InterviewSessionConfig {
  config: InterviewConfig;
  style: InterviewStyle;
  inputMode: InputMode;
}

interface SessionResult {
  messages: Message[];
  duration: number;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("mode-select");
  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  
  // Sales state
  const [salesConfig, setSalesConfig] = useState<SalesConfig | null>(null);
  const [salesResult, setSalesResult] = useState<SessionResult | null>(null);
  
  // Interview state
  const [interviewConfig, setInterviewConfig] = useState<InterviewSessionConfig | null>(null);
  const [interviewResult, setInterviewResult] = useState<SessionResult | null>(null);

  // Mock Discovery state
  const [mockDiscoveryConfig, setMockDiscoveryConfig] = useState<MockDiscoveryConfig | null>(null);
  const [mockDiscoveryResult, setMockDiscoveryResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (!getApiKey()) {
      setScreen("api-key");
    }
  }, []);

  // API Key handlers
  const handleApiKeyComplete = () => {
    setScreen("mode-select");
  };

  // Mode selection handlers
  const handleSelectMode = (mode: PracticeMode) => {
    setPracticeMode(mode);
    if (mode === "sales") {
      setScreen("sales-setup");
    } else if (mode === "interview") {
      setScreen("interview-setup");
    } else if (mode === "mockDiscovery") {
      setScreen("mock-discovery-setup");
    }
  };

  const handleOpenSettings = () => {
    // Could open a settings modal - for now just go to API key screen
    setScreen("api-key");
  };

  // Sales handlers
  const handleStartSalesCall = (callType: CallType, temperament: TemperamentLevel, inputMode: InputMode) => {
    setSalesConfig({ callType, temperament, inputMode });
    setScreen("sales-call");
  };

  const handleEndSalesCall = (messages: Message[], duration: number) => {
    setSalesResult({ messages, duration });
    setScreen("sales-feedback");
  };

  const handleSalesPracticeAgain = () => {
    if (salesConfig) {
      setSalesResult(null);
      setScreen("sales-call");
    }
  };

  const handleSalesChangeSettings = () => {
    setSalesResult(null);
    setScreen("sales-setup");
  };

  // Interview handlers
  const handleStartInterview = (config: InterviewConfig, style: InterviewStyle, inputMode: InputMode) => {
    setInterviewConfig({ config, style, inputMode });
    setScreen("interview-call");
  };

  const handleEndInterview = (messages: Message[], duration: number) => {
    setInterviewResult({ messages, duration });
    setScreen("interview-feedback");
  };

  const handleInterviewPracticeAgain = () => {
    if (interviewConfig) {
      setInterviewResult(null);
      setScreen("interview-call");
    }
  };

  const handleInterviewChangeSettings = () => {
    setInterviewResult(null);
    setScreen("interview-setup");
  };

  // Mock Discovery handlers
  const handleStartMockDiscovery = (config: MockDiscoveryConfig) => {
    setMockDiscoveryConfig(config);
    setScreen("mock-discovery-call");
  };

  const handleEndMockDiscovery = (messages: Message[], duration: number) => {
    setMockDiscoveryResult({ messages, duration });
    setScreen("mock-discovery-feedback");
  };

  const handleMockDiscoveryPracticeAgain = () => {
    if (mockDiscoveryConfig) {
      setMockDiscoveryResult(null);
      setScreen("mock-discovery-call");
    }
  };

  const handleMockDiscoveryChangeSettings = () => {
    setMockDiscoveryResult(null);
    setScreen("mock-discovery-setup");
  };

  // Back handlers
  const handleBackToModeSelect = () => {
    setScreen("mode-select");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* API Key Screen */}
      {screen === "api-key" && (
        <ApiKeyScreen onComplete={handleApiKeyComplete} />
      )}

      {/* Mode Selection */}
      {screen === "mode-select" && (
        <ModeSelector 
          onSelectMode={handleSelectMode}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Sales Flow */}
      {screen === "sales-setup" && (
        <SetupScreen 
          onStartCall={handleStartSalesCall}
          onBack={handleBackToModeSelect}
        />
      )}

      {screen === "sales-call" && salesConfig && (
        salesConfig.inputMode === "voice" ? (
          <CallScreen
            callType={salesConfig.callType}
            temperament={salesConfig.temperament}
            onEndCall={handleEndSalesCall}
          />
        ) : (
          <TextCallScreen
            callType={salesConfig.callType}
            temperament={salesConfig.temperament}
            onEndCall={handleEndSalesCall}
          />
        )
      )}

      {screen === "sales-feedback" && salesResult && (
        <FeedbackScreen
          messages={salesResult.messages}
          duration={salesResult.duration}
          onPracticeAgain={handleSalesPracticeAgain}
          onChangeSettings={handleSalesChangeSettings}
        />
      )}

      {/* Interview Flow */}
      {screen === "interview-setup" && (
        <HiringManagerSetup
          onBack={handleBackToModeSelect}
          onStartInterview={handleStartInterview}
        />
      )}

      {screen === "interview-call" && interviewConfig && (
        interviewConfig.inputMode === "voice" ? (
          <VoiceInterviewScreen
            config={interviewConfig.config}
            style={interviewConfig.style}
            onEndInterview={handleEndInterview}
          />
        ) : (
          <TextInterviewScreen
            config={interviewConfig.config}
            style={interviewConfig.style}
            onEndInterview={handleEndInterview}
          />
        )
      )}

      {screen === "interview-feedback" && interviewResult && interviewConfig && (
        <InterviewFeedbackScreen
          messages={interviewResult.messages}
          duration={interviewResult.duration}
          config={interviewConfig.config}
          onPracticeAgain={handleInterviewPracticeAgain}
          onChangeSettings={handleInterviewChangeSettings}
        />
      )}

      {/* Mock Discovery Flow */}
      {screen === "mock-discovery-setup" && (
        <MockDiscoverySetup
          onStartCall={handleStartMockDiscovery}
          onBack={handleBackToModeSelect}
        />
      )}

      {screen === "mock-discovery-call" && mockDiscoveryConfig && (
        mockDiscoveryConfig.inputMode === "voice" ? (
          <MockDiscoveryVoiceScreen
            scenario={mockDiscoveryConfig.scenario}
            onEndCall={handleEndMockDiscovery}
          />
        ) : (
          <MockDiscoveryTextScreen
            scenario={mockDiscoveryConfig.scenario}
            onEndCall={handleEndMockDiscovery}
          />
        )
      )}

      {screen === "mock-discovery-feedback" && mockDiscoveryResult && mockDiscoveryConfig && (
        <MockDiscoveryFeedbackScreen
          messages={mockDiscoveryResult.messages}
          duration={mockDiscoveryResult.duration}
          scenario={mockDiscoveryConfig.scenario}
          onPracticeAgain={handleMockDiscoveryPracticeAgain}
          onChangeSettings={handleMockDiscoveryChangeSettings}
        />
      )}
    </div>
  );
};

export default Index;
