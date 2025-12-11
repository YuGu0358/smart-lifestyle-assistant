import DashboardLayout from "@/components/DashboardLayout";
import TumAccountDialog from "@/components/TumAccountDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertCircle, Brain, Calendar, MapPin, TrendingUp, Utensils, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const { data: focusMode } = trpc.focusMode.get.useQuery();
  const tumAccountQuery = trpc.tumAccount.get.useQuery();
  const [showTumDialog, setShowTumDialog] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const { data: courses } = trpc.courses.list.useQuery();
  const { data: meals } = trpc.meals.list.useQuery();
  const { data: wellness } = trpc.wellness.get.useQuery();

  const todayCourses = useMemo(() => {
    if (!courses) return [];
    const today = new Date();
    return courses.filter((course) => {
      const courseDate = new Date(course.startTime);
      return courseDate.toDateString() === today.toDateString();
    });
  }, [courses]);

  const stats = [
    {
      title: "Focus Mode",
      value: focusMode?.currentMode || "balanced",
      icon: <Brain className="h-4 w-4" />,
      description: "Current optimization mode",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Today's Classes",
      value: todayCourses.length,
      icon: <Calendar className="h-4 w-4" />,
      description: "Scheduled courses",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Meals Logged",
      value: meals?.length || 0,
      icon: <Utensils className="h-4 w-4" />,
      description: "This week",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Wellness Score",
      value: wellness ? "Good" : "Setup",
      icon: <Activity className="h-4 w-4" />,
      description: wellness ? "On track" : "Complete profile",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* TUM Account Onboarding Banner */}
        {showBanner && tumAccountQuery.data?.isVerified !== 1 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Welcome to Smart Lifestyle Assistant!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link your TUM student account to unlock course schedule integration,
                    personalized meal recommendations based on your class times, and smart commute planning.
                  </p>
                  <Button
                    onClick={() => setShowTumDialog(true)}
                    className="mt-3"
                    size="sm"
                  >
                    Link TUM Account Now
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your overview for today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your classes and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {todayCourses.length > 0 ? (
                <div className="space-y-3">
                  {todayCourses.map((course) => (
                    <div key={course.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-xs text-muted-foreground">
                          {new Date(course.startTime).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(course.endTime).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{course.courseName}</p>
                        {course.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {course.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No classes today</p>
                  <p className="text-sm">Import your calendar to see your schedule</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>Personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    🎯 Focus Mode Active
                  </p>
                  <p className="text-sm text-blue-700">
                    You're in <span className="font-semibold capitalize">{focusMode?.currentMode || "balanced"}</span> mode. 
                    {focusMode?.currentMode === "study" && " Prioritizing deep work sessions."}
                    {focusMode?.currentMode === "health" && " Focusing on wellness and recovery."}
                    {focusMode?.currentMode === "balanced" && " Maintaining work-life balance."}
                    {focusMode?.currentMode === "exam" && " Optimizing for peak performance."}
                  </p>
                </div>

                {!wellness && (
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm font-medium text-orange-900 mb-1">
                      ⚡ Complete Your Profile
                    </p>
                    <p className="text-sm text-orange-700">
                      Set up your wellness goals to get personalized meal and schedule recommendations.
                    </p>
                  </div>
                )}

                {courses && courses.length === 0 && (
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm font-medium text-purple-900 mb-1">
                      📅 Import Your Calendar
                    </p>
                    <p className="text-sm text-purple-700">
                      Upload your TUM course schedule to enable smart commute planning and time optimization.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TumAccountDialog
        open={showTumDialog}
        onOpenChange={setShowTumDialog}
        onVerified={() => {
          tumAccountQuery.refetch();
          setShowBanner(false);
        }}
      />
    </DashboardLayout>
  );
}
