import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Mic, Keyboard, ArrowLeft, CheckCircle, AlertTriangle, Info, Shuffle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { INPUT_MODES, InputMode } from "@/lib/constants";
import { getDefaultInputMode, setDefaultInputMode } from "@/lib/storage";
import { SCENARIO_PRODUCTS, getRandomScenario } from "@/lib/prompts";

export interface MockDiscoveryConfig {
  inputMode: InputMode;
  scenario: typeof SCENARIO_PRODUCTS[0];
}

interface MockDiscoverySetupProps {
  onStartCall: (config: MockDiscoveryConfig) => void;
  onBack?: () => void;
}

const DIFFICULTY_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  2: { label: "Standard", color: "text-green-500", bg: "bg-green-500/10" },
  3: { label: "Challenging", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  4: { label: "Advanced", color: "text-orange-500", bg: "bg-orange-500/10" },
};

export function MockDiscoverySetup({ onStartCall, onBack }: MockDiscoverySetupProps) {
  const [inputMode, setInputMode] = useState<InputMode>(getDefaultInputMode());
  const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIO_PRODUCTS[0]>(() => getRandomScenario());
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);

  const handleStart = () => {
    setDefaultInputMode(inputMode);
    onStartCall({ inputMode, scenario: selectedScenario });
  };

  const handleRandomScenario = () => {
    let newScenario = getRandomScenario();
    // Ensure we get a different scenario
    while (newScenario.id === selectedScenario.id && SCENARIO_PRODUCTS.length > 1) {
      newScenario = getRandomScenario();
    }
    setSelectedScenario(newScenario);
  };

  const difficultyInfo = DIFFICULTY_LABELS[selectedScenario.difficulty] || DIFFICULTY_LABELS[2];

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
          {/* Scenario Selection */}
          <div className="glass-card p-6 border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">Your Scenario</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRandomScenario}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Shuffle className="w-4 h-4" />
                Randomize
              </Button>
            </div>

            {/* Selected Scenario Card */}
            <div className="bg-secondary/30 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{selectedScenario.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedScenario.category}</p>
                </div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded", difficultyInfo.color, difficultyInfo.bg)}>
                  {difficultyInfo.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{selectedScenario.description}</p>
              <div className="space-y-1">
                {selectedScenario.bullets.map((bullet, i) => (
                  <p key={i} className="text-sm">• {bullet}</p>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-400">Selling to:</span> Tong-Tong Li, GTM Engineering Manager at Clay
                </p>
              </div>
            </div>

            {/* Scenario Selector Toggle */}
            <button
              onClick={() => setShowScenarioSelector(!showScenarioSelector)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <span className="text-sm font-medium">Choose specific scenario ({SCENARIO_PRODUCTS.length} available)</span>
              {showScenarioSelector ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Scenario List */}
            {showScenarioSelector && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {SCENARIO_PRODUCTS.map((scenario) => {
                  const isSelected = scenario.id === selectedScenario.id;
                  const scenarioDifficulty = DIFFICULTY_LABELS[scenario.difficulty] || DIFFICULTY_LABELS[2];
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setShowScenarioSelector(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        isSelected
                          ? "bg-green-500/20 ring-1 ring-green-500"
                          : "bg-secondary/20 hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="text-xs text-muted-foreground">{scenario.category}</p>
                        </div>
                        <span className={cn("text-xs px-2 py-0.5 rounded", scenarioDifficulty.color, scenarioDifficulty.bg)}>
                          {scenarioDifficulty.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
