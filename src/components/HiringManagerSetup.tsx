import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Briefcase, Search, Loader2, Mic, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTERVIEW_STYLES, INPUT_MODES, InterviewConfig, InputMode, InterviewStyle } from "@/lib/constants";
import { getApiKey } from "@/lib/storage";

interface HiringManagerSetupProps {
  onBack: () => void;
  onStartInterview: (config: InterviewConfig, style: InterviewStyle, inputMode: InputMode) => void;
}

export function HiringManagerSetup({ onBack, onStartInterview }: HiringManagerSetupProps) {
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerTitle, setInterviewerTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyContext, setCompanyContext] = useState("");
  const [interviewerContext, setInterviewerContext] = useState("");
  const [style, setStyle] = useState(3);
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [isResearching, setIsResearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentStyle = INTERVIEW_STYLES.find((s) => s.level === style);
  
  const canStart = companyName.trim() && roleName.trim() && interviewerName.trim();

  const handleResearch = async () => {
    if (!companyName || !roleName || !interviewerName) return;
    
    setIsResearching(true);
    const apiKey = getApiKey();
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a research assistant helping someone prepare for a job interview. Provide concise, relevant information."
            },
            {
              role: "user",
              content: `I'm preparing for an interview. Please research and provide:

1. COMPANY CONTEXT for "${companyName}":
- What they do (1-2 sentences)
- Company size/stage if known
- Recent news or notable things
- Culture/values if known

2. ROLE CONTEXT for "${roleName}" at this company:
- Typical responsibilities
- What they likely look for in candidates
- Key skills needed

3. INTERVIEWER CONTEXT for "${interviewerName}"${interviewerTitle ? `, ${interviewerTitle}` : ''} at ${companyName}:
- Their likely background/experience
- What they probably care about in interviews
- Any public info if this is a real person

Format as three separate paragraphs, no headers. Be concise but informative.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const research = data.choices?.[0]?.message?.content || "";
      
      // Split into sections
      const sections = research.split(/\n\n+/);
      if (sections.length >= 1) setCompanyContext(sections[0] || "");
      if (sections.length >= 2) setJobDescription(sections[1] || "");
      if (sections.length >= 3) setInterviewerContext(sections[2] || "");
      
      setShowAdvanced(true);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleStart = () => {
    const config: InterviewConfig = {
      companyName: companyName.trim(),
      roleName: roleName.trim(),
      interviewerName: interviewerName.trim(),
      interviewerTitle: interviewerTitle.trim() || "Hiring Manager",
      jobDescription: jobDescription.trim(),
      companyContext: companyContext.trim(),
      interviewerContext: interviewerContext.trim(),
    };
    onStartInterview(config, style as InterviewStyle, inputMode);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 rounded-xl bg-primary/10">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Interview Practice Setup</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Interview Details
            </h2>
            <div className="glass-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input
                    placeholder="e.g., Anthropic"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role *</label>
                  <Input
                    placeholder="e.g., GTM Engineer"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interviewer Name *</label>
                  <Input
                    placeholder="e.g., Sarah Chen"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interviewer Title</label>
                  <Input
                    placeholder="e.g., VP of Sales"
                    value={interviewerTitle}
                    onChange={(e) => setInterviewerTitle(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Research Button */}
              <Button
                variant="secondary"
                onClick={handleResearch}
                disabled={!companyName || !roleName || !interviewerName || isResearching}
                className="w-full gap-2"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Auto-Research Company, Role & Interviewer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Advanced Context (expandable) */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            >
              {showAdvanced ? "▼" : "▶"} Additional Context (Optional)
            </button>
            
            {showAdvanced && (
              <div className="glass-card p-6 space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Context</label>
                  <Textarea
                    placeholder="What does the company do? Culture, recent news, etc."
                    value={companyContext}
                    onChange={(e) => setCompanyContext(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Description / Role Details</label>
                  <Textarea
                    placeholder="Key responsibilities, requirements, what they're looking for..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interviewer Background</label>
                  <Textarea
                    placeholder="Their background, what they care about, interview style..."
                    value={interviewerContext}
                    onChange={(e) => setInterviewerContext(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input Mode */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Input Mode
            </h2>
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
                      "glass-card p-4 text-left transition-all duration-200",
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <h4 className="font-medium">{config.title}</h4>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview Style */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Interviewer Style
            </h2>
            <div className="glass-card p-6">
              <div className="mb-6">
                <Slider
                  value={[style]}
                  onValueChange={([value]) => setStyle(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span>Challenging</span>
                <span>Probing</span>
                <span>Balanced</span>
                <span>Conversational</span>
                <span>Friendly</span>
              </div>
              {currentStyle && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{currentStyle.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Level {currentStyle.level}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentStyle.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Card */}
          {canStart && (
            <div className="glass-card p-6 border-l-4 border-primary/50 animate-fade-in">
              <h3 className="font-medium mb-2">Interview Preview</h3>
              <p className="text-sm text-muted-foreground">
                You'll be interviewed by <strong>{interviewerName}</strong>
                {interviewerTitle && <>, {interviewerTitle}</>} at <strong>{companyName}</strong> for the <strong>{roleName}</strong> position.
              </p>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            size="lg"
            className="w-full h-14 text-lg font-medium gap-3"
          >
            <Briefcase className="w-5 h-5" />
            Start Interview
          </Button>
        </div>
      </main>
    </div>
  );
}
