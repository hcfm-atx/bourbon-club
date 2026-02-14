"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award } from "lucide-react";

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  category: string;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  reviews: "Reviews",
  meetings: "Meetings",
  social: "Social",
  tasting: "Tasting",
};

const CATEGORY_COLORS: Record<string, string> = {
  reviews: "border-l-purple-500",
  meetings: "border-l-blue-500",
  social: "border-l-green-500",
  tasting: "border-l-amber-500",
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-600" />
          <h1 className="text-3xl font-bold">Achievements</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Group by category
  const categories = Object.keys(CATEGORY_LABELS);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-amber-600" />
          <h1 className="text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          {earnedCount} of {achievements.length} unlocked
        </p>
      </div>

      {categories.map((category) => {
        const categoryAchievements = achievements.filter(
          (a) => a.category === category
        );
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {CATEGORY_LABELS[category]}
              <Badge variant="secondary">
                {categoryAchievements.filter((a) => a.earned).length} /{" "}
                {categoryAchievements.length}
              </Badge>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryAchievements.map((achievement) => {
                const progressPercent = Math.min(
                  (achievement.progress / achievement.threshold) * 100,
                  100
                );

                return (
                  <Card
                    key={achievement.id}
                    className={`border-l-4 ${
                      CATEGORY_COLORS[category]
                    } transition-all hover:shadow-md ${
                      achievement.earned
                        ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-background"
                        : "grayscale-[0.3] opacity-80"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div
                          className={`text-4xl ${
                            achievement.earned ? "" : "opacity-50"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg leading-tight">
                              {achievement.name}
                            </h3>
                            {achievement.earned && (
                              <Badge className="bg-amber-600 text-white shrink-0">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {achievement.description}
                          </p>
                          {achievement.earned ? (
                            <p className="text-xs text-muted-foreground mt-2">
                              Earned{" "}
                              {new Date(
                                achievement.earnedAt!
                              ).toLocaleDateString()}
                            </p>
                          ) : (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Progress
                                </span>
                                <span className="font-medium">
                                  {achievement.progress} / {achievement.threshold}
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-600 h-2 transition-all rounded-full"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
