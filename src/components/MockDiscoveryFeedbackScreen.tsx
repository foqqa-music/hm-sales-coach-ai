import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Copy, Check, RotateCcw, Settings, Quote, Target, AlertTriangle, CheckCircle, MessageSquare, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useRealtimeChat";
import { getApiKey } from "@/lib/storage";
import { TONG_TONG_FEEDBACK_PROMPT, SCENARIO_PRODUCTS } from "@/lib/prompts";

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

interface MeddicItem {
  found: boolean;
  details: string;
}

interface ChallengerItem {
  done: boolean;
  example: string;
}

interface SampleBetterQuestion {
  theirQuestion: string;
  betterVersion: string;
  why?: string;
}

interface FeedbackData {
  scores: {
    discoveryQuestions: number;
    activeListening: number;
    businessImpact: number;
    challengerMeddic: number;
  };
  talkTimeEstimate: {
    candidatePercent: number;
    buyerPercent: number;
    assessment: string;
  };
  questionCount: {
    total: number;
    assessment: string;
  };
  categoryFeedback: {
    discoveryQuestions: CategoryFeedback;
    activeListening: CategoryFeedback;
    businessImpact: CategoryFeedback;
    challengerMeddic: CategoryFeedback;
  };
  meddic: {
    metric: MeddicItem;
    economicBuyer: MeddicItem;
    decisionCriteria: MeddicItem;
    decisionProcess: MeddicItem;
    identifyPain: MeddicItem;
    champion: MeddicItem;
  };
  challenger: {
    ledWithInsight: ChallengerItem;
    challengedAssumptions: ChallengerItem;
    reframedProblem: ChallengerItem;
    prescriptiveClose: ChallengerItem;
  };
  redFlagsHit: string[];
  greenFlagsHit: string[];
  keyMoments: Array<{ type: "positive" | "negative"; timestamp: string; text: string }>;
  overallAssessment: string;
  topPriorities: string[];
  whatWorkedWell: string[];
  sampleBetterQuestions: SampleBetterQuestion[];
  nextSessionRecommendation?: string;
}

interface MockDiscoveryFeedbackScreenProps {
  messages: Message[];
  duration: number;
  scenario: typeof SCENARIO_PRODUCTS[0];
  onPracticeAgain: () => void;
  onChangeSettings: () => void;
}

const SCORE_CATEGORIES = [
  { key: "discoveryQuestions", label: "Opening & Discovery Questions", description: "Agenda setting, open-ended questions, layered follow-ups" },
  { key: "activeListening", label: "Active Listening & Talk Ratio", description: "Responding to answers, adapting, using their language" },
  { key: "businessImpact", label: "Business Impact Quantification", description: "Connecting to dollars, time, opportunity cost" },
  { key: "challengerMeddic", label: "Challenger Methodology & MEDDIC", description: "Insights, challenging assumptions, qualification" },
] as const;

const MEDDIC_LABELS = {
  metric: "Metric",
  economicBuyer: "Economic Buyer",
  decisionCriteria: "Decision Criteria",
  decisionProcess: "Decision Process",
  identifyPain: "Identify Pain",
  champion: "Champion",
};

const CHALLENGER_LABELS = {
  ledWithInsight: "Led with Insight",
  challengedAssumptions: "Challenged Assumptions",
  reframedProblem: "Reframed Problem",
  prescriptiveClose: "Prescriptive Close",
};

export function MockDiscoveryFeedbackScreen({ messages, duration, scenario, onPracticeAgain, onChangeSettings }: MockDiscoveryFeedbackScreenProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["discoveryQuestions", "activeListening", "businessImpact", "challengerMeddic"]));
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
      .map((m) => `${m.role === "user" ? "CANDIDATE" : "TONG-TONG"}: ${m.content}`)
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
              content: TONG_TONG_FEEDBACK_PROMPT + transcript,
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
      setError("Failed to analyze session. Please try again.");
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
    ? feedback.scores.discoveryQuestions +
      feedback.scores.activeListening +
      feedback.scores.businessImpact +
      feedback.scores.challengerMeddic
    : 0;

  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return "text-red-500";
    if (percentage < 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getScoreBorderColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage < 50) return "border-red-500";
    if (percentage < 70) return "border-yellow-500";
    return "border-green-500";
  };

  const copyTranscript = () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "YOU" : "TONG-TONG"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-green-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your discovery call...</p>
          <p className="text-sm text-muted-foreground mt-2">Evaluating against top performer benchmarks</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center glass-card p-8 max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm mb-4">
            <Target className="w-4 h-4" />
            Mock Discovery Complete
          </div>
          <h1 className="text-2xl font-semibold mb-2">{scenario.name}</h1>
          <p className="text-muted-foreground">{scenario.category} • {formatDuration(duration)} • {messages.length} exchanges</p>
        </div>

        {/* Overall Score + Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {/* Overall Score */}
          <div className="glass-card p-6 text-center border-green-500/20 col-span-1">
            <div
              className={cn(
                "w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-2",
                getScoreBorderColor(totalScore)
              )}
            >
              <span className={cn("text-3xl font-bold", getScoreColor(totalScore))}>
                {totalScore}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">out of 100</p>
          </div>

          {/* Talk Time */}
          <div className="glass-card p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Talk Ratio</p>
            </div>
            {feedback?.talkTimeEstimate ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span>You: {feedback.talkTimeEstimate.candidatePercent}%</span>
                  <span>Buyer: {feedback.talkTimeEstimate.buyerPercent}%</span>
                </div>
                <p className={cn(
                  "text-xs",
                  feedback.talkTimeEstimate.assessment === "good balance" ? "text-green-500" : "text-yellow-500"
                )}>
                  {feedback.talkTimeEstimate.assessment}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Target: 43-46% you</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not available</p>
            )}
          </div>

          {/* Question Count */}
          <div className="glass-card p-4 col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Questions Asked</p>
            </div>
            {feedback?.questionCount ? (
              <>
                <p className="text-2xl font-bold">{feedback.questionCount.total}</p>
                <p className={cn(
                  "text-xs",
                  feedback.questionCount.assessment.includes("optimal") ? "text-green-500" : "text-yellow-500"
                )}>
                  {feedback.questionCount.assessment}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Target: 11-14</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not available</p>
            )}
          </div>
        </div>

        {/* Overall Assessment */}
        {feedback?.overallAssessment && (
          <div className="glass-card p-4">
            <p className="text-sm">{feedback.overallAssessment}</p>
          </div>
        )}

        {/* MEDDIC Checklist */}
        {feedback?.meddic && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3">MEDDIC Qualification</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(feedback.meddic).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    value.found ? "bg-green-500/20" : "bg-red-500/20"
                  )}>
                    {value.found ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <span className="text-red-500 text-xs">✗</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{MEDDIC_LABELS[key as keyof typeof MEDDIC_LABELS]}</p>
                    <p className="text-xs text-muted-foreground">{value.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenger Checklist */}
        {feedback?.challenger && (
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium mb-3">Challenger Methodology</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(feedback.challenger).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    value.done ? "bg-green-500/20" : "bg-yellow-500/20"
                  )}>
                    {value.done ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <span className="text-yellow-500 text-xs">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{CHALLENGER_LABELS[key as keyof typeof CHALLENGER_LABELS]}</p>
                    <p className="text-xs text-muted-foreground">{value.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Green Flags */}
        {feedback?.greenFlagsHit && feedback.greenFlagsHit.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-green-500/50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-green-500">What Worked Well</h3>
            </div>
            <div className="space-y-2">
              {feedback.greenFlagsHit.map((flag, i) => (
                <p key={i} className="text-sm">✓ {flag}</p>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {feedback?.redFlagsHit && feedback.redFlagsHit.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-red-500/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-medium text-red-500">Areas to Improve</h3>
            </div>
            <div className="space-y-2">
              {feedback.redFlagsHit.map((flag, i) => (
                <p key={i} className="text-sm text-red-400">✗ {flag}</p>
              ))}
            </div>
          </div>
        )}

        {/* Top Priorities */}
        {feedback?.topPriorities && feedback.topPriorities.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-primary uppercase tracking-wide">
              🎯 Before Your Real Interview
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

        {/* Better Questions */}
        {feedback?.sampleBetterQuestions && feedback.sampleBetterQuestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              💡 Question Improvements
            </h2>
            <div className="glass-card p-4 space-y-4">
              {feedback.sampleBetterQuestions.map((sq, i) => (
                <div key={i} className="space-y-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="text-sm">
                    <span className="text-red-400 text-xs uppercase">Your question:</span>
                    <p className="text-muted-foreground italic">"{sq.theirQuestion}"</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-400 text-xs uppercase">Better version:</span>
                    <p>"{sq.betterVersion}"</p>
                  </div>
                  {sq.why && (
                    <p className="text-xs text-muted-foreground">{sq.why}</p>
                  )}
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
                    <p className="text-xs text-muted-foreground mt-2">{category.description}</p>
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
                                obs.type === "positive" ? "bg-green-500/10" : "bg-red-500/10"
                              )}
                            >
                              {obs.quote && (
                                <div className="flex items-start gap-2 mb-2">
                                  <Quote className={cn(
                                    "w-4 h-4 mt-0.5 flex-shrink-0",
                                    obs.type === "positive" ? "text-green-500" : "text-red-500"
                                  )} />
                                  <p className="italic text-muted-foreground">"{obs.quote}"</p>
                                </div>
                              )}
                              <p className={cn(
                                obs.type === "positive" ? "text-green-500" : "text-red-500"
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
                      moment.type === "positive" ? "bg-green-500" : "bg-red-500"
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
                        msg.role === "user" ? "bg-primary/10" : "bg-green-500/10"
                      )}
                    >
                      <span className="font-medium uppercase text-xs tracking-wide mr-2">
                        {msg.role === "user" ? "You" : "Tong-Tong"}:
                      </span>
                      {msg.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next Session Recommendation */}
        {feedback?.nextSessionRecommendation && (
          <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
            <p className="text-sm">
              <span className="text-blue-400 font-medium">Next session:</span> {feedback.nextSessionRecommendation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onPracticeAgain} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
            <RotateCcw className="w-4 h-4" />
            Practice Again
          </Button>
          <Button variant="secondary" onClick={onChangeSettings} className="gap-2">
            <Settings className="w-4 h-4" />
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
