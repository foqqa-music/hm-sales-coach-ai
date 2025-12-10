import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Mic, Keyboard, ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react";
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
          {/* Scenario Brief */}
          <div className="glass-card p-6 border-green-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold">Your Scenario</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">Clay</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Contact</p>
                  <p className="font-medium">Tong-Tong Li, GTM Engineering Manager</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Your Product: DataClean Pro</p>
                <ul className="mt-1 space-y-1 text-foreground">
                  <li>• Verifies email/phone accuracy before you pay for enrichment</li>
                  <li>• Catches data decay in real-time (updates when contacts change jobs)</li>
                  <li>• Flags duplicates and standardizes formatting</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-green-400 font-medium">Objective: Qualify this opportunity through discovery</p>
                <p className="text-muted-foreground">Duration: 30-45 minutes</p>
              </div>
            </div>
          </div>

          {/* Interviewer Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center text-lg font-semibold text-green-400">
                TT
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tong-Tong Li</h2>
                <p className="text-muted-foreground">GTM Engineering Manager at Clay</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Former #1 Tesla Energy Advisor • Built Clay's GTM Engineer function
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-400 font-medium">Format:</span> You're selling TO Tong-Tong (Clay is the buyer). Run discovery to qualify the opportunity and understand their needs.
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
                  <p className="font-medium">Diagnostic Approach</p>
                  <p className="text-sm text-muted-foreground">Systematic problem identification before solution pitching</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Business Impact Focus</p>
                  <p className="text-sm text-muted-foreground">Connecting problems to dollars, time, and opportunity cost</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Challenger Methodology</p>
                  <p className="text-sm text-muted-foreground">Teaching insights, challenging assumptions, taking control</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">MEDDIC Qualification</p>
                  <p className="text-sm text-muted-foreground">Metric, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmarks */}
          <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
            <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wide mb-3">
              📊 Top Performer Benchmarks
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Questions Asked</p>
                <p className="font-medium">11-14 targeted</p>
              </div>
              <div>
                <p className="text-muted-foreground">Your Talk Time</p>
                <p className="font-medium">43-46%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Buyer Talk Time</p>
                <p className="font-medium">54-57%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Problems Uncovered</p>
                <p className="font-medium">3-4 specific</p>
              </div>
            </div>
          </div>

          {/* Red Flags to Avoid */}
          <div className="glass-card p-6 border-red-500/20">
            <h3 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Fatal Mistakes to Avoid
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-foreground">Premature pitchulation</span> — Pitching in first 5-10 minutes before diagnosing</li>
              <li>• <span className="text-foreground">Not quantifying impact</span> — Missing the "how much?" and "how often?"</li>
              <li>• <span className="text-foreground">Talking too much</span> — Over 60% talk time is a red flag</li>
              <li>• <span className="text-foreground">Checklist discovery</span> — Front-loaded questions without follow-ups</li>
              <li>• <span className="text-foreground">Missing decision process</span> — Not asking who else is involved</li>
            </ul>
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
