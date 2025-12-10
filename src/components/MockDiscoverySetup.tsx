import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Mic, Keyboard, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { INPUT_MODES, InputMode } from "@/lib/constants";
import { getDefaultInputMode, setDefaultInputMode } from "@/lib/storage";

interface MockDiscoverySetupProps {
  onStartCall: (inputMode: InputMode) => void;
  onBack?: () => void;
}

export function MockDiscoverySetup({ onStartCall, onBack }: MockDiscoverySetupProps) {
  const [inputMode, setInputMode] = useState<InputMode>(getDefaultInputMode());

  const handleStart = () => {
    setDefaultInputMode(inputMode);
    onStartCall(inputMode);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 rounded-xl bg-green-500/10">
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold">Mock Discovery: Clay Interview</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Interviewer Card */}
          <div className="glass-card p-6 border-green-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-lg font-semibold text-green-400">
                TT
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tong-Tong Li</h2>
                <p className="text-muted-foreground">GTM Engineer Manager at Clay</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Former #1 Tesla Energy Advisor • Built Clay's GTM Engineer function
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-400 font-medium">Interview Type:</span> Mock Discovery Call — You'll run discovery on a "prospect" (played by Tong-Tong) to demonstrate your diagnostic and systems thinking skills.
            </p>
          </div>

          {/* What They're Testing */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              What This Tests
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Diagnostic Ability</p>
                  <p className="text-sm text-muted-foreground">Can you systematically break down fuzzy GTM problems?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Systems Thinking</p>
                  <p className="text-sm text-muted-foreground">Data → Enrichment → Scoring → Routing → Activation → Measurement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Commercial Bias + Technical Fluency</p>
                  <p className="text-sm text-muted-foreground">Does the workflow actually help someone close a deal?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Red Flags to Avoid */}
          <div className="glass-card p-6 border-red-500/20">
            <h3 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Red Flags to Avoid
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-foreground">Tunnel vision</span> — Only suggesting email when LinkedIn, phone, direct mail might also work</li>
              <li>• <span className="text-foreground">Ignoring risks</span> — Not mentioning deliverability, data quality, or targeting fatigue</li>
              <li>• <span className="text-foreground">Over-engineering</span> — Jumping to complex solutions before testing simple ones</li>
              <li>• <span className="text-foreground">No commercial awareness</span> — Technical elegance without revenue connection</li>
              <li>• <span className="text-foreground">Talking too much</span> — You should be asking questions, not pitching</li>
            </ul>
          </div>

          {/* Key Reminder */}
          <div className="glass-card p-4 bg-green-500/5 border-green-500/20">
            <p className="text-sm text-center">
              <span className="text-green-400 font-medium">Remember:</span> Clay uses "reverse demos" — they value candidates who can solve real problems live over polished presentations. Come with a hypothesis, not a pitch.
            </p>
          </div>

          {/* Input Mode Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Input Mode
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(INPUT_MODES) as InputMode[]).map((mode) => {
                const config = INPUT_MODES[mode];
                const isSelected = inputMode === mode;
                const Icon = mode === "voice" ? Mic : Keyboard;

                return (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={cn(
                      "glass-card p-5 text-left transition-all duration-200",
                      isSelected
                        ? "ring-2 ring-green-500 bg-green-500/5"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "bg-green-500/20" : "bg-secondary"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isSelected ? "text-green-500" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <h4 className="font-medium">{config.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full h-14 text-lg font-medium gap-3 bg-green-600 hover:bg-green-700"
          >
            <Target className="w-5 h-5" />
            Start Mock Discovery
          </Button>
        </div>
      </main>
    </div>
  );
}
