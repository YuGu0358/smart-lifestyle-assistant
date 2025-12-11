import DashboardLayout from "@/components/DashboardLayout";
import TumAccountDialog from "@/components/TumAccountDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Heart, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { data: profile, refetch } = trpc.wellness.get.useQuery();
  const tumAccountQuery = trpc.tumAccount.get.useQuery();
  const utils = trpc.useUtils();
  const [showTumDialog, setShowTumDialog] = useState(false);
  const [formData, setFormData] = useState({
    dailyCalorieGoal: "",
    proteinGoal: "",
    budgetGoal: "",
    dietaryRestrictions: "",
    preferredCuisines: "",
    homeAddress: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        dailyCalorieGoal: profile.dailyCalorieGoal?.toString() || "",
        proteinGoal: profile.proteinGoal?.toString() || "",
        budgetGoal: profile.budgetGoal?.toString() || "",
        dietaryRestrictions: profile.dietaryRestrictions || "",
        preferredCuisines: profile.preferredCuisines || "",
        homeAddress: profile.homeAddress || "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.wellness.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      dailyCalorieGoal: formData.dailyCalorieGoal ? parseInt(formData.dailyCalorieGoal) : null,
      proteinGoal: formData.proteinGoal ? parseInt(formData.proteinGoal) : null,
      budgetGoal: formData.budgetGoal ? parseInt(formData.budgetGoal) : null,
      dietaryRestrictions: formData.dietaryRestrictions || null,
      preferredCuisines: formData.preferredCuisines || null,
      homeAddress: formData.homeAddress || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8" />
            Wellness Profile
          </h1>
          <p className="text-muted-foreground">
            Set your health goals and dietary preferences
          </p>
        </div>

        {/* TUM Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>TUM Student Account</CardTitle>
            <CardDescription>Link your TUM account to sync course schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {tumAccountQuery.data?.isVerified === 1 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      TUM Account Linked
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      TUM Account Not Linked
                    </>
                  )}
                </h3>
                {tumAccountQuery.data?.isVerified === 1 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {tumAccountQuery.data.tumEmail}
                    {tumAccountQuery.data.faculty && ` • ${tumAccountQuery.data.faculty}`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Link your TUM student account to access course integration
                  </p>
                )}
              </div>
              {tumAccountQuery.data?.isVerified !== 1 && (
                <Button onClick={() => setShowTumDialog(true)} size="sm">
                  Link TUM Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Nutritional Goals</CardTitle>
              <CardDescription>
                Define your daily targets for personalized meal recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calories">Daily Calorie Goal (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="e.g., 2000"
                    value={formData.dailyCalorieGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyCalorieGoal: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 2000-2500 kcal for active students
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protein">Daily Protein Goal (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="e.g., 80"
                    value={formData.proteinGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, proteinGoal: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 0.8-1.2g per kg body weight
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Daily Budget (cents)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 1000 (€10.00)"
                    value={formData.budgetGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetGoal: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter amount in cents (e.g., 1000 = €10.00)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictions">Dietary Restrictions</Label>
                <Textarea
                  id="restrictions"
                  placeholder="e.g., vegetarian, lactose-intolerant, nut allergy"
                  value={formData.dietaryRestrictions}
                  onChange={(e) =>
                    setFormData({ ...formData, dietaryRestrictions: e.target.value })
                  }
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple restrictions with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisines">Preferred Cuisines</Label>
                <Textarea
                  id="cuisines"
                  placeholder="e.g., Mediterranean, Asian, German"
                  value={formData.preferredCuisines}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredCuisines: e.target.value })
                  }
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple cuisines with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeAddress">Home Address</Label>
                <Textarea
                  id="homeAddress"
                  placeholder="e.g., Leopoldstraße 13, 80802 München"
                  value={formData.homeAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, homeAddress: e.target.value })
                  }
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Used for personalized commute planning from home to campus
                </p>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Why Set Up Your Profile?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Your wellness profile helps the AI provide personalized recommendations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Meal Planning:</strong> Get dish suggestions that match your calorie, protein, and budget goals
              </li>
              <li>
                <strong className="text-foreground">Dietary Safety:</strong> Automatically filter out dishes with your allergens or restrictions
              </li>
              <li>
                <strong className="text-foreground">Smart Scheduling:</strong> AI considers your nutrition needs when planning meal times
              </li>
              <li>
                <strong className="text-foreground">Progress Tracking:</strong> Monitor your daily intake against your goals
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <TumAccountDialog
        open={showTumDialog}
        onOpenChange={setShowTumDialog}
        onVerified={() => {
          tumAccountQuery.refetch();
          utils.tumAccount.get.invalidate();
        }}
      />
    </DashboardLayout>
  );
}
