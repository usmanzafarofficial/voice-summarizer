import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getPlans, getUserUsage, type Plan, type UsageData } from "@/lib/api";
import { Check } from "phosphor-react";

export default function ManageSubscription() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/?login=1");
      return;
    }

    async function loadData() {
      try {
        const [plansData, usageData] = await Promise.all([
          getPlans(),
          getUserUsage(token),
        ]);
        setPlans(plansData);
        setUsage(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, token, navigate]);

  const formatUsage = (current: number, limit: number) => {
    if (limit === -1) return `${current} / Unlimited`;
    return `${current} / ${limit}`;
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return "bg-primary";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="glass border-border">
            <CardContent className="p-6">
              <p className="text-destructive">{error || "Failed to load subscription data"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.name === usage.plan.name);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-light text-foreground mb-8 text-center">
            Manage <span className="text-primary-glow">Subscription</span>
          </h1>

          {usage.plan.name === "Free" && (
            <Card className="glass border-primary/50 border-2 mb-6">
              <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
                <p className="text-muted-foreground">
                  You&apos;re on the free plan. Upgrade to unlock unlimited voice summaries, PDF downloads, and more.
                </p>
                <Button onClick={() => navigate("/plans")} className="bg-gradient-to-r from-primary to-accent">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Plan & Usage */}
          <Card className="glass border-border mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-primary-glow">Current Plan & Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">Plan</span>
                  <span className="text-primary-glow font-semibold">{usage.plan.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">Billing Period</span>
                  <span className="text-muted-foreground capitalize">{usage.plan.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      usage.subscription.status === "active" || usage.subscription.status === "completed"
                        ? "bg-green-500/20 text-green-500"
                        : usage.subscription.status === "free"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {usage.subscription.status === "free" ? "Free tier" : usage.subscription.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">AI Voices Generated</span>
                    <span className="text-muted-foreground">
                      {formatUsage(usage.usage.voicesGenerated, usage.limits.voices)}
                    </span>
                  </div>
                  {usage.limits.voices !== -1 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(
                          usage.usage.voicesGenerated,
                          usage.limits.voices
                        )}`}
                        style={{
                          width: `${getUsagePercentage(usage.usage.voicesGenerated, usage.limits.voices)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">Summarization Edits</span>
                    <span className="text-muted-foreground">
                      {formatUsage(usage.usage.summarizationEdits, usage.limits.edits)}
                    </span>
                  </div>
                  {usage.limits.edits !== -1 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(
                          usage.usage.summarizationEdits,
                          usage.limits.edits
                        )}`}
                        style={{
                          width: `${getUsagePercentage(usage.usage.summarizationEdits, usage.limits.edits)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">PDF Downloads</span>
                    <span className="text-muted-foreground">
                      {formatUsage(usage.usage.pdfDownloads, usage.limits.pdfs)}
                    </span>
                  </div>
                  {usage.limits.pdfs !== -1 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(
                          usage.usage.pdfDownloads,
                          usage.limits.pdfs
                        )}`}
                        style={{
                          width: `${getUsagePercentage(usage.usage.pdfDownloads, usage.limits.pdfs)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.name === usage.plan.name;
              return (
                <Card
                  key={plan._id}
                  className={`glass border-2 transition-all ${
                    isCurrentPlan
                      ? "border-primary shadow-glow-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary-glow">
                        ${plan.price}
                        {plan.period !== "one-time" && (
                          <span className="text-lg text-muted-foreground">/{plan.period === "monthly" ? "mo" : "yr"}</span>
                        )}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check size={16} className="text-primary-glow shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {!isCurrentPlan && (
                      <Button
                        onClick={() => navigate("/plans")}
                        className="w-full bg-gradient-to-r from-primary to-accent"
                      >
                        {usage.plan.name === "Free" ? "Upgrade" : "Change Plan"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
