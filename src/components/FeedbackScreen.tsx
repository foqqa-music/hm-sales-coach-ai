import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Copy, Check, RotateCcw, Settings, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useRealtimeChat";
import { getApiKey } from "@/lib/storage";
import { FEEDBACK_ANALYSIS_PROMPT } from "@/lib/prompts";

interface Observation {
  type: "positive" | "negative";
  quote: string;
  analysis: string;
}

interface CategoryFeedback {
  score: number;
  observations: Observation[];
  summary: string;
}

interface FeedbackData {
  scores: {
    discovery: number;
    painMetrics: number;
    objectionHandling: number;
    conversationControl: number;
  };
  categoryFeedback: {
    discovery: CategoryFeedback;
    painMetrics: CategoryFeedback;
    objectionHandling: CategoryFeedback;
    conversationControl: CategoryFeedback;
  };
  keyMoments: Array<{ type: "positive" | "negative"; timestamp: string; text: string }>;
  overallAssessment: string;
  topPriorities: string[];
  whatWorkedWell: string[];
}

interface FeedbackScreenProps {
  messages: Message[];
  duration: number;
  onPracticeAgain: () => void;
  onChangeSettings: () => void;
}

const SCORE_CATEGORIES = [
  { key: "discovery", label: "Hypothesis-Driven Discovery", description: "Research, perspective, and specificity" },
  { key: "painMetrics", label: "Pain & Metrics Uncovered", description: "Depth of discovery and quantification" },
  { key: "objectionHandling", label: "Objection Handling", description: "Confidence and technique with pushback" },
  { key: "conversationControl", label: "Conversation Control", description: "Talk ratio, flow, and guidance" },
] as const;

export function FeedbackScreen({ messages, duration, onPracticeAgain, onChangeSettings }: FeedbackScreenProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["discovery", "painMetrics", "objectionHandling", "conversationControl"]));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    analyzeFeedback();
  }, []);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const analyzeFeedback = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API key not found");
      setLoading(false);
      return;
    }

    if (messages.length === 0) {
      setError("No conversation to analyze");
      setLoading(false);
      return;
    }

    const transcript = messages
      .map((m) => `${m.role === "user" ? "REP" : "SAM"}: ${m.content}`)
      .join("\n");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: FEEDBACK_ANALYSIS_PROMPT + transcript,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze feedback");
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      setFeedback(parsed);
    } catch (err) {
      console.error("Feedback analysis error:", err);
      setError("Failed to analyze call. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const totalScore = feedback
    ? feedback.scores.discovery +
      feedback.scores.painMetrics +
      feedback.scores.objectionHandling +
      feedback.scores.conversationControl
    : 0;

  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return "text-destructive";
    if (percentage < 70) return "text-warning";
    return "text-success";
  };

  const getScoreBorderColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return "border-destructive";
    if (percentage < 70) return "border-warning";
    return "border-success";
  };

  const copyTranscript = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "YOU" : "SAM"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your call...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center glass-card p-8 max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onPracticeAgain}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Call Complete</h1>
          <p className="text-muted-foreground">Duration: {formatDuration(duration)} • {messages.length} exchanges</p>
        </div>

        {/* Overall Score */}
        <div className="glass-card p-8 text-center">
          <div
            className={cn(
              "w-28 h-28 rounded-full border-4 flex items-center justify-center mx-auto mb-4",
              getScoreBorderColor(totalScore)
            )}
          >
            <span className={cn("text-4xl font-bold", getScoreColor(totalScore))}>
              {totalScore}
            </span>
          </div>
          <p className="text-muted-foreground mb-4">out of 100</p>
          
          {/* Overall Assessment */}
          {feedback?.overallAssessment && (
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {feedback.overallAssessment}
            </p>
          )}
        </div>

        {/* What Worked Well */}
        {feedback?.whatWorkedWell && feedback.whatWorkedWell.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-success uppercase tracking-wide">
              ✓ What Worked Well
            </h2>
            <div className="glass-card p-4 space-y-2 border-l-4 border-success/50">
              {feedback.whatWorkedWell.map((item, i) => (
                <p key={i} className="text-sm">{item}</p>
              ))}
            </div>
          </div>
        )}

        {/* Top Priorities */}
        {feedback?.topPriorities && feedback.topPriorities.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-primary uppercase tracking-wide">
              🎯 Top Priorities to Improve
            </h2>
            <div className="glass-card p-4 space-y-3">
              {feedback.topPriorities.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="bg-primary/20 text-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Score Breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Detailed Score Breakdown
          </h2>
          <div className="space-y-3">
            {SCORE_CATEGORIES.map((category) => {
              const score = feedback?.scores[category.key] ?? 0;
              const categoryDetail = feedback?.categoryFeedback?.[category.key];
              const isExpanded = expandedCategories.has(category.key);

              return (
                <div key={category.key} className="glass-card overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.key)}
                    className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.label}</h3>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn("text-xl font-bold", getScoreColor(score, 25))}>
                        {score}/25
                      </span>
                    </div>
                    <Progress value={(score / 25) * 100} className="h-2" />
                  </button>

                  {isExpanded && categoryDetail && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                      {/* Summary */}
                      <p className="text-sm text-muted-foreground">{categoryDetail.summary}</p>

                      {/* Observations */}
                      {categoryDetail.observations && categoryDetail.observations.length > 0 && (
                        <div className="space-y-3">
                          {categoryDetail.observations.map((obs, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-lg p-3 text-sm",
                                obs.type === "positive" ? "bg-success/10" : "bg-destructive/10"
                              )}
                            >
                              {obs.quote && (
                                <div className="flex items-start gap-2 mb-2">
                                  <Quote className={cn(
                                    "w-4 h-4 mt-0.5 flex-shrink-0",
                                    obs.type === "positive" ? "text-success" : "text-destructive"
                                  )} />
                                  <p className="italic text-muted-foreground">"{obs.quote}"</p>
                                </div>
                              )}
                              <p className={cn(
                                obs.type === "positive" ? "text-success" : "text-destructive"
                              )}>
                                {obs.analysis}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Moments */}
        {feedback?.keyMoments && feedback.keyMoments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Key Moments
            </h2>
            <div className="glass-card divide-y divide-border/50">
              {feedback.keyMoments.map((moment, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      moment.type === "positive" ? "bg-success" : "bg-destructive"
                    )}
                  />
                  <div>
                    {moment.timestamp && (
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {moment.timestamp}
                      </span>
                    )}
                    <p className="text-sm">{moment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="space-y-3">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Full Transcript ({messages.length} messages)
            </h2>
            {showTranscript ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showTranscript && (
            <div className="glass-card p-4 animate-scale-in">
              <div className="flex justify-end mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTranscript}
                  className="gap-2 text-muted-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No messages recorded
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-sm p-2 rounded",
                        msg.role === "user" ? "bg-primary/10" : "bg-secondary/50"
                      )}
                    >
                      <span className="font-medium uppercase text-xs tracking-wide mr-2">
                        {msg.role === "user" ? "You" : "Sam"}:
                      </span>
                      {msg.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onPracticeAgain} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </Button>
          <Button variant="secondary" onClick={onChangeSettings} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
