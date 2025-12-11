import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Brain, GraduationCap, Heart, Scale, Sparkles, Trophy } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const FOCUS_MODES = [
  {
    mode: "study" as const,
    icon: <GraduationCap className="h-8 w-8" />,
    title: "Study Mode",
    description: "Maximize academic productivity",
    details: "Prioritizes scheduling deep work sessions for high-priority tasks, aligning them with your peak cognitive periods.",
    color: "blue",
  },
  {
    mode: "health" as const,
    icon: <Heart className="h-8 w-8" />,
    title: "Health Mode",
    description: "Enhance physical and mental well-being",
    details: "Guarantees time for workouts, meal prep, and sufficient sleep, even if it means deprioritizing less urgent tasks.",
    color: "green",
  },
  {
    mode: "balanced" as const,
    icon: <Scale className="h-8 w-8" />,
    title: "Balanced Mode",
    description: "Default all-around optimization",
    details: "Seeks a sustainable equilibrium between academics, health, and social life, preventing burnout.",
    color: "purple",
  },
  {
    mode: "exam" as const,
    icon: <Trophy className="h-8 w-8" />,
    title: "Exam Mode",
    description: "Peak performance for exams",
    details: "Drastically reduces non-essential activities, schedules intensive revision blocks, and integrates breaks to optimize learning retention.",
    color: "orange",
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    button: "bg-green-600 hover:bg-green-700",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    button: "bg-orange-600 hover:bg-orange-700",
  },
};

export default function FocusMode() {
  const { data: focusMode, refetch } = trpc.focusMode.get.useQuery();
  const { data: optimization, isLoading: optimizationLoading } = trpc.focusMode.optimize.useQuery(
    focusMode ? { mode: focusMode.currentMode } : undefined,
    { enabled: !!focusMode }
  );

  const updateMutation = trpc.focusMode.update.useMutation({
    onSuccess: () => {
      toast.success("Focus mode updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update focus mode: ${error.message}`);
    },
  });

  const handleModeChange = (mode: "study" | "health" | "balanced" | "exam") => {
    updateMutation.mutate({ currentMode: mode });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Focus Modes
          </h1>
          <p className="text-muted-foreground">
            Optimize your schedule based on your current priorities
          </p>
        </div>

        {/* Current Mode */}
        {focusMode && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Current Mode: <span className="capitalize">{focusMode.currentMode}</span>
              </CardTitle>
              <CardDescription>
                Your schedule is optimized for {focusMode.currentMode} mode
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Mode Selection */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Select Your Focus</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FOCUS_MODES.map((modeConfig) => {
              const isActive = focusMode?.currentMode === modeConfig.mode;
              const colors = colorClasses[modeConfig.color as keyof typeof colorClasses];

              return (
                <Card
                  key={modeConfig.mode}
                  className={`transition-all ${
                    isActive ? `border-2 ${colors.border} ${colors.bg}` : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                        {modeConfig.icon}
                      </div>
                      {isActive && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{modeConfig.title}</CardTitle>
                    <CardDescription>{modeConfig.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{modeConfig.details}</p>
                    <Button
                      className="w-full"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => handleModeChange(modeConfig.mode)}
                      disabled={isActive || updateMutation.isPending}
                    >
                      {isActive ? "Currently Active" : "Activate Mode"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI Optimization */}
        {optimization && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Schedule Optimization
              </CardTitle>
              <CardDescription>
                Recommendations for your current focus mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{optimization.optimization}</Streamdown>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>How Focus Modes Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Focus Modes use AI to dynamically re-plan your entire schedule based on your current priorities:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Study Mode:</strong> Blocks out deep work time during your peak hours
              </li>
              <li>
                <strong className="text-foreground">Health Mode:</strong> Ensures you have time for exercise, meal prep, and sleep
              </li>
              <li>
                <strong className="text-foreground">Balanced Mode:</strong> Maintains equilibrium between all aspects of life
              </li>
              <li>
                <strong className="text-foreground">Exam Mode:</strong> Maximizes study time with strategic breaks
              </li>
            </ul>
            <p className="text-muted-foreground">
              You can switch modes at any time, or even use natural language like "I have exams next week, switch to exam mode"
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
