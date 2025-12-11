import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Brain, Calendar, MapPin, Sparkles, Utensils } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  // Show nothing while checking auth or redirecting
  if (loading || isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: <Utensils className="h-8 w-8" />,
      title: "Smart Meal Planning",
      description: "Get personalized meal recommendations from TUM canteens based on your nutritional goals and budget.",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Intelligent Commute",
      description: "Optimize your daily commute with real-time MVV data and AI-powered route suggestions.",
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Focus Modes",
      description: "Switch between Study, Health, Balanced, and Exam modes to optimize your schedule for different priorities.",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Life Coach",
      description: "Chat with your personal AI assistant that learns from your patterns and provides proactive suggestions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Get Started</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Lifestyle Management</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Smart Life Coach for TUM
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Balance academics, health, and personal well-being with an AI assistant that understands your unique student life. From meal planning to commute optimization, we've got you covered.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Start Free</a>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Everything You Need</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three interconnected modules powered by GenAI to optimize your daily life
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">How It Works</h3>
            <p className="text-muted-foreground">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Import Your Schedule</h4>
              <p className="text-sm text-muted-foreground">
                Upload your TUM course calendar (.ics file) to sync your classes and locations
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Set Your Goals</h4>
              <p className="text-sm text-muted-foreground">
                Define your nutritional targets, budget, and wellness preferences
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Let AI Optimize</h4>
              <p className="text-sm text-muted-foreground">
                Receive personalized recommendations and proactive suggestions every day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl text-white">Ready to Transform Your Student Life?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join TUM students who are already optimizing their daily routines with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>Get Started Now</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 {APP_TITLE}. Built for TUM students.</p>
        </div>
      </footer>
    </div>
  );
}
