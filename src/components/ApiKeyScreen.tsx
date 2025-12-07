import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Key } from "lucide-react";
import { setApiKey } from "@/lib/storage";

interface ApiKeyScreenProps {
  onComplete: () => void;
}

export function ApiKeyScreen({ onComplete }: ApiKeyScreenProps) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (!key.startsWith("sk-")) {
      setError("API key should start with 'sk-'");
      return;
    }

    setApiKey(key.trim());
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="glass-card p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6 mx-auto">
            <Key className="w-7 h-7 text-primary" />
          </div>

          <h1 className="text-2xl font-semibold text-center mb-2">
            Connect OpenAI
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your OpenAI API key to enable voice conversations
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                placeholder="sk-..."
                className="pr-10 bg-secondary border-border/50 h-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full h-12 font-medium">
              Save & Continue
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Your key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
