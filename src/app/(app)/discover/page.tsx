"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Flame, DollarSign, Droplets, GraduationCap, Star, Sparkles } from "lucide-react";

interface DiscoveredBourbon {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  price: number | null;
  age: number | null;
  type: string;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  matchScore: number;
}

const FLAVOR_OPTIONS = [
  { value: "sweet", label: "Sweet", icon: "🍯", description: "Vanilla, caramel, honey" },
  { value: "spicy", label: "Spicy", icon: "🌶️", description: "Cinnamon, pepper, rye" },
  { value: "fruity", label: "Fruity", icon: "🍒", description: "Cherry, citrus, dried fruit" },
  { value: "oaky", label: "Oaky", icon: "🪵", description: "Wood, smoke, leather" },
];

const PRICE_RANGES = [
  { value: "budget", label: "$20-40", min: 20, max: 40, icon: DollarSign },
  { value: "mid", label: "$40-60", min: 40, max: 60, icon: DollarSign },
  { value: "premium", label: "$60-100", min: 60, max: 100, icon: DollarSign },
  { value: "luxury", label: "$100+", min: 100, max: 1000, icon: DollarSign },
];

const PROOF_OPTIONS = [
  { value: "light", label: "Light & Easy", range: "<90 proof", min: 0, max: 90, icon: Droplets },
  { value: "medium", label: "Medium", range: "90-100 proof", min: 90, max: 100, icon: Droplets },
  { value: "barrel", label: "Barrel Proof", range: "100+ proof", min: 100, max: 200, icon: Flame },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", description: "New to bourbon", icon: GraduationCap },
  { value: "intermediate", label: "Intermediate", description: "Trying new styles", icon: GraduationCap },
  { value: "expert", label: "Expert", description: "Seasoned enthusiast", icon: GraduationCap },
];

export default function DiscoverPage() {
  const [step, setStep] = useState(1);
  const [flavor, setFlavor] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [proof, setProof] = useState("");
  const [experience, setExperience] = useState("");
  const [results, setResults] = useState<DiscoveredBourbon[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    if (step === 1) return flavor !== "";
    if (step === 2) return priceRange !== "";
    if (step === 3) return proof !== "";
    if (step === 4) return experience !== "";
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      findMatches();
    }
  };

  const findMatches = async () => {
    setLoading(true);
    const selectedPrice = PRICE_RANGES.find((p) => p.value === priceRange);
    const selectedProof = PROOF_OPTIONS.find((p) => p.value === proof);

    const params = new URLSearchParams({
      flavor,
      experience,
      minPrice: String(selectedPrice?.min || 0),
      maxPrice: String(selectedPrice?.max || 1000),
      minProof: String(selectedProof?.min || 0),
      maxProof: String(selectedProof?.max || 200),
    });

    const res = await fetch(`/api/bourbons/discover?${params}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
    setStep(5); // Results step
  };

  const reset = () => {
    setStep(1);
    setFlavor("");
    setPriceRange("");
    setProof("");
    setExperience("");
    setResults([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-amber-500" />
          Bourbon Discovery Quiz
        </h1>
        <p className="text-muted-foreground">
          Answer a few questions to discover your perfect bourbon match
        </p>
      </div>

      {step <= totalSteps && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Question {step} of {totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What flavor profile do you prefer?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FLAVOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFlavor(option.value)}
                  className={`p-6 rounded-lg border-2 transition-all text-left hover:border-amber-500 ${
                    flavor === option.value
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What is your preferred price range?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRICE_RANGES.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPriceRange(option.value)}
                    className={`p-6 rounded-lg border-2 transition-all hover:border-amber-500 ${
                      priceRange === option.value
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-xl">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>What proof level do you prefer?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROOF_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setProof(option.value)}
                    className={`p-6 rounded-lg border-2 transition-all hover:border-amber-500 ${
                      proof === option.value
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                        : "border-border"
                    }`}
                  >
                    <Icon className="w-10 h-10 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-center">{option.label}</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">{option.range}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>What is your bourbon experience level?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXPERIENCE_LEVELS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setExperience(option.value)}
                    className={`p-6 rounded-lg border-2 transition-all hover:border-amber-500 ${
                      experience === option.value
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                        : "border-border"
                    }`}
                  >
                    <Icon className="w-10 h-10 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-center">{option.label}</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Personalized Recommendations</CardTitle>
                <Button variant="outline" size="sm" onClick={reset}>
                  Retake Quiz
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Finding your perfect matches...</p>
              ) : results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No bourbons match your criteria yet. Try adjusting your preferences or add more bourbons to the collection.
                  </p>
                  <Button onClick={reset}>Try Again</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((bourbon, index) => (
                    <Link key={bourbon.id} href={`/bourbons/${bourbon.id}`}>
                      <div className="border rounded-lg p-4 hover:border-amber-500 transition-all hover:shadow-md">
                        <div className="flex gap-4">
                          {bourbon.imageUrl && (
                            <div className="relative w-20 h-20 shrink-0">
                              <Image
                                src={bourbon.imageUrl}
                                alt={bourbon.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">#{index + 1}</Badge>
                                  <h3 className="font-semibold text-lg">{bourbon.name}</h3>
                                </div>
                                {bourbon.distillery && (
                                  <p className="text-sm text-muted-foreground">{bourbon.distillery}</p>
                                )}
                              </div>
                              {bourbon.avgRating !== null && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="font-semibold">{bourbon.avgRating.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({bourbon.reviewCount})
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              {bourbon.proof && (
                                <span className="text-muted-foreground">{bourbon.proof}° proof</span>
                              )}
                              {bourbon.age && (
                                <span className="text-muted-foreground">{bourbon.age} years</span>
                              )}
                              {bourbon.price && (
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  ${bourbon.price.toFixed(2)}
                                </span>
                              )}
                              <Badge variant="outline">{bourbon.type.replace("_", " ")}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="text-center pt-4">
                    <Link href="/bourbons">
                      <Button variant="outline">Browse All Bourbons &rarr;</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step <= totalSteps && (
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {step === totalSteps ? "Find My Matches" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
