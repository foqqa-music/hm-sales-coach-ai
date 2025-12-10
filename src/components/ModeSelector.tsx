import { Phone, Briefcase, Settings, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { PracticeMode, PRACTICE_MODES } from "@/lib/constants";

interface ModeSelectorProps {
  onSelectMode: (mode: PracticeMode) => void;
  onOpenSettings: () => void;
}

export function ModeSelector({ onSelectMode, onOpenSettings }: ModeSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Practice Mode</h1>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">What would you like to practice?</h2>
            <p className="text-muted-foreground">Choose a practice mode to get started</p>
          </div>

          <div className="grid gap-4">
            {/* Mock Discovery - Clay/Tong Tong (Featured) */}
            <button
              onClick={() => onSelectMode("mockDiscovery")}
              className={cn(
                "glass-card p-6 text-left transition-all duration-200",
                "ring-2 ring-green-500/50 bg-green-500/5",
                "hover:ring-green-500 hover:bg-green-500/10",
                "group"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 text-green-500 group-hover:bg-green-500/30 transition-colors">
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{PRACTICE_MODES.mockDiscovery.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">PREP</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    {PRACTICE_MODES.mockDiscovery.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Hypothesis-Driven</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Systems Thinking</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Clay-Specific</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Sales Practice */}
            <button
              onClick={() => onSelectMode("sales")}
              className={cn(
                "glass-card p-6 text-left transition-all duration-200",
                "hover:ring-2 hover:ring-primary hover:bg-primary/5",
                "group"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{PRACTICE_MODES.sales.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {PRACTICE_MODES.sales.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Cold Calls</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Discovery Calls</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Objection Handling</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Interview Practice */}
            <button
              onClick={() => onSelectMode("interview")}
              className={cn(
                "glass-card p-6 text-left transition-all duration-200",
                "hover:ring-2 hover:ring-primary hover:bg-primary/5",
                "group"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{PRACTICE_MODES.interview.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {PRACTICE_MODES.interview.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Custom Company</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Custom Role</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">Auto-Research</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Voice or text mode available for all practice types
          </p>
        </div>
      </main>
    </div>
  );
}
