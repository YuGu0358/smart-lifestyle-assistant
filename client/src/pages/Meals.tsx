import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ChefHat, Sparkles, TrendingUp, Utensils } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Meals() {
  const [todayHistory, setTodayHistory] = useState({
    caloriesConsumed: 0,
    proteinConsumed: 0,
    budgetSpent: 0,
  });

  const { data: menuData, isLoading: menuLoading } = trpc.mensa.getTodayMenu.useQuery();
  const { data: portionData, isLoading: portionLoading, refetch } = trpc.mensa.getPortionRecommendations.useQuery({
    todayHistory,
  });

  const hasPortionData = portionData?.success && 'recommendations' in portionData;
  const recommendations = hasPortionData ? portionData.recommendations : [];
  const aiSummary = hasPortionData ? portionData.aiSummary : null;
  const dailyProgress = hasPortionData ? portionData.dailyProgress : null;

  const isLoading = menuLoading || portionLoading;

  const handleLogMeal = (mealId: number) => {
    const recommendation = recommendations.find((r: any) => r.mealId === mealId);
    if (recommendation) {
      setTodayHistory(prev => ({
        caloriesConsumed: prev.caloriesConsumed + recommendation.nutritionBreakdown.calories,
        proteinConsumed: prev.proteinConsumed + recommendation.nutritionBreakdown.protein,
        budgetSpent: prev.budgetSpent + recommendation.nutritionBreakdown.price,
      }));
      toast.success(`Logged: ${recommendation.mealName}`);
      setTimeout(() => refetch(), 500);
    }
  };

  const calorieProgress = dailyProgress?.caloriesRemaining
    ? ((2000 - dailyProgress.caloriesRemaining) / 2000) * 100
    : 0;
  const proteinProgress = dailyProgress?.proteinRemaining
    ? ((80 - dailyProgress.proteinRemaining) / 80) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Utensils className="h-8 w-8" />
            Meal Planner
          </h1>
          <p className="text-muted-foreground">
            Real-time menu from Heilbronn Mensa with AI-powered portion recommendations
          </p>
        </div>

        {/* Daily Progress */}
        {dailyProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calories</span>
                  <span className="font-semibold">
                    {2000 - dailyProgress.caloriesRemaining} / 2000 kcal
                  </span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Protein</span>
                  <span className="font-semibold">
                    {80 - dailyProgress.proteinRemaining} / 80g
                  </span>
                </div>
                <Progress value={proteinProgress} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget</span>
                  <span className="font-semibold">
                    €{((1000 - dailyProgress.budgetRemaining) / 100).toFixed(2)} / €10.00
                  </span>
                </div>
                <Progress
                  value={((1000 - dailyProgress.budgetRemaining) / 1000) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        {aiSummary && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Meal Planning Advice
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your fitness goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{aiSummary}</Streamdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu with Portion Recommendations */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Today's Menu at Heilbronn Mensa
          </h2>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : menuData?.meals && menuData.meals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menuData.meals.map((meal) => {
                const recommendation = recommendations.find((r: any) => r.mealId === meal.id);
                return (
                  <Card key={meal.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{meal.name}</CardTitle>
                      <CardDescription>{meal.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Dietary Labels */}
                      {(meal.isVegetarian || meal.isVegan || meal.notes.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {meal.isVegan && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Vegan
                            </Badge>
                          )}
                          {meal.isVegetarian && !meal.isVegan && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              Vegetarian
                            </Badge>
                          )}
                          {meal.notes.slice(0, 2).map((note, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Nutrition Info */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price (Student)</span>
                          <span className="font-semibold">
                            €{((meal.prices.students || meal.prices.others || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                        {meal.estimatedCalories && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Calories</span>
                            <span className="font-semibold">{meal.estimatedCalories} kcal</span>
                          </div>
                        )}
                        {meal.estimatedProtein && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Protein</span>
                            <span className="font-semibold">{meal.estimatedProtein}g</span>
                          </div>
                        )}
                      </div>

                      {/* AI Portion Recommendation */}
                      {recommendation && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">Recommended Portion</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span className="font-semibold">
                                {recommendation.recommendedPortion}x ({recommendation.portionInGrams}g)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Calories:</span>
                              <span className="font-semibold">
                                {recommendation.nutritionBreakdown.calories} kcal
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Protein:</span>
                              <span className="font-semibold">
                                {recommendation.nutritionBreakdown.protein}g
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {recommendation.reasoning}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => handleLogMeal(meal.id)}
                          >
                            Log This Meal
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No menu available for today. The Mensa might be closed or data is not yet available.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
