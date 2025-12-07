import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Phone, PhoneIncoming, Calendar, Headphones, Mic, Keyboard, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROSPECT, TEMPERAMENT_LABELS, CALL_TYPES, INPUT_MODES, CallType, TemperamentLevel, InputMode } from "@/lib/constants";
import { getDefaultTemperament, getDefaultCallType, getDefaultInputMode, setDefaultTemperament, setDefaultCallType, setDefaultInputMode } from "@/lib/storage";

interface SetupScreenProps {
  onStartCall: (callType: CallType, temperament: TemperamentLevel, inputMode: InputMode) => void;
  onBack?: () => void;
}

export function SetupScreen({ onStartCall, onBack }: SetupScreenProps) {
  const [callType, setCallType] = useState<CallType>(getDefaultCallType());
  const [temperament, setTemperament] = useState<number>(getDefaultTemperament());
  const [inputMode, setInputMode] = useState<InputMode>(getDefaultInputMode());

  const currentTemperament = TEMPERAMENT_LABELS.find((t) => t.level === temperament);

  const handleStart = () => {
    setDefaultCallType(callType);
    setDefaultTemperament(temperament);
    setDefaultInputMode(inputMode);
    onStartCall(callType, temperament as TemperamentLevel, inputMode);
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
          <div className="p-2 rounded-xl bg-primary/10">
            <Headphones className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Sales Call Trainer</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
          {/* Prospect Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-semibold">
                {PROSPECT.initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{PROSPECT.name}</h2>
                <p className="text-muted-foreground">
                  {PROSPECT.title} at {PROSPECT.company}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {PROSPECT.details}
                </p>
              </div>
            </div>
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
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "bg-primary/20" : "bg-secondary"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
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

          {/* Call Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Call Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(CALL_TYPES) as CallType[]).map((type) => {
                const config = CALL_TYPES[type];
                const isSelected = callType === type;
                const Icon = type === "cold" ? PhoneIncoming : Calendar;

                return (
                  <button
                    key={type}
                    onClick={() => setCallType(type)}
                    className={cn(
                      "glass-card p-5 text-left transition-all duration-200",
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSelected ? "bg-primary/20" : "bg-secondary"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
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

          {/* Temperament Slider */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Prospect Temperament
            </h3>
            <div className="glass-card p-6">
              <div className="mb-6">
                <Slider
                  value={[temperament]}
                  onValueChange={([value]) => setTemperament(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span>Hostile</span>
                <span>Skeptical</span>
                <span>Neutral</span>
                <span>Warm</span>
                <span>Eager</span>
              </div>
              {currentTemperament && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{currentTemperament.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Level {currentTemperament.level}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentTemperament.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full h-14 text-lg font-medium gap-3"
          >
            <Phone className="w-5 h-5" />
            Start Call
          </Button>
        </div>
      </main>
    </div>
  );
}
