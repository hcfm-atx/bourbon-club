"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { ChevronLeft, GlassWater, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
  proof: number | null;
  price: number | null;
  cost: number | null;
  age: number | null;
  type: string;
  avgRating: number | null;
  reviewCount: number;
  categoryScores: {
    appearance: number | null;
    nose: number | null;
    taste: number | null;
    mouthfeel: number | null;
    finish: number | null;
  };
  valueScore: number | null;
}

interface BourbonOption {
  id: string;
  name: string;
  avgRating: number | null;
}

const COLORS = ["#d97706", "#2563eb", "#16a34a"];

export default function BourbonComparePage() {
  const [allBourbons, setAllBourbons] = useState<BourbonOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<Bourbon[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetch("/api/bourbons")
      .then((r) => r.json())
      .then((data) => {
        setAllBourbons(data.bourbons || data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setCompareData([]);
      return;
    }

    setComparing(true);
    fetch(`/api/bourbons/compare?ids=${selectedIds.join(",")}`)
      .then((r) => r.json())
      .then(setCompareData)
      .finally(() => setComparing(false));
  }, [selectedIds]);

  const addBourbon = (id: string) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeBourbon = (id: string) => {
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
  };

  // Prepare radar chart data
  const radarData = compareData.length > 0 ? [
    { category: "Appearance", ...Object.fromEntries(compareData.map(b => [b.name, b.categoryScores.appearance ?? 0])) },
    { category: "Nose", ...Object.fromEntries(compareData.map(b => [b.name, b.categoryScores.nose ?? 0])) },
    { category: "Taste", ...Object.fromEntries(compareData.map(b => [b.name, b.categoryScores.taste ?? 0])) },
    { category: "Mouthfeel", ...Object.fromEntries(compareData.map(b => [b.name, b.categoryScores.mouthfeel ?? 0])) },
    { category: "Finish", ...Object.fromEntries(compareData.map(b => [b.name, b.categoryScores.finish ?? 0])) },
  ] : [];

  // Find best value for each metric
  const getBest = (field: keyof Bourbon | "categoryScores") => {
    if (compareData.length === 0) return null;
    if (field === "categoryScores") {
      // Overall category average
      return compareData.reduce((best, b) => {
        const scores = Object.values(b.categoryScores).filter((v): v is number => v !== null);
        const avg = scores.length > 0 ? scores.reduce((sum, v) => sum + v, 0) / scores.length : 0;
        const bestScores = Object.values(best.categoryScores).filter((v): v is number => v !== null);
        const bestAvg = bestScores.length > 0 ? bestScores.reduce((sum, v) => sum + v, 0) / bestScores.length : 0;
        return avg > bestAvg ? b : best;
      }).id;
    }
    return compareData.reduce((best, b) => {
      const val = b[field] as number | null;
      const bestVal = best[field] as number | null;
      if (val === null) return best;
      if (bestVal === null) return b;
      return val > bestVal ? b : best;
    }).id;
  };

  const bestOverall = getBest("avgRating");
  const bestValue = getBest("valueScore");
  const bestProof = getBest("proof");
  const bestAge = getBest("age");

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/bourbons" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Bourbons
        </Link>
        <h1 className="text-3xl font-bold">Compare Bourbons</h1>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/bourbons" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Bourbons
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compare Bourbons</h1>
        <p className="text-sm text-muted-foreground">Select 2-3 bourbons to compare</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Bourbons ({selectedIds.length}/3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const bourbon = allBourbons.find((b) => b.id === id);
                if (!bourbon) return null;
                return (
                  <Badge key={id} variant="secondary" className="pl-3 pr-2 py-1.5 text-sm">
                    {bourbon.name}
                    <button
                      onClick={() => removeBourbon(id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            {selectedIds.length < 3 && (
              <Select value="" onValueChange={addBourbon}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a bourbon to compare..." />
                </SelectTrigger>
                <SelectContent>
                  {allBourbons
                    .filter((b) => !selectedIds.includes(b.id))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} {b.avgRating !== null ? `(${b.avgRating.toFixed(1)}/10)` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedIds.length === 0 && (
        <EmptyState
          icon={GlassWater}
          title="No bourbons selected"
          description="Select 2-3 bourbons from the dropdown above to see a detailed comparison."
        />
      )}

      {comparing && (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      )}

      {!comparing && compareData.length > 0 && (
        <>
          {compareData.some(b => Object.values(b.categoryScores).some(v => v !== null)) && (
            <Card>
              <CardHeader>
                <CardTitle>Tasting Profile Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    {compareData.map((b, i) => (
                      <Radar
                        key={b.id}
                        name={b.name}
                        dataKey={b.name}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Metric</TableHead>
                      {compareData.map((b) => (
                        <TableHead key={b.id} className="text-center">
                          <Link href={`/bourbons/${b.id}`} className="hover:underline">
                            {b.name}
                          </Link>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Distillery</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center">
                          {b.distillery || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Type</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center">
                          {b.type.replace("_", " ")}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Proof</TableCell>
                      {compareData.map((b) => (
                        <TableCell
                          key={b.id}
                          className={`text-center ${b.id === bestProof ? "bg-green-50 dark:bg-green-950 font-bold" : ""}`}
                        >
                          {b.proof ? `${b.proof}°` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Age</TableCell>
                      {compareData.map((b) => (
                        <TableCell
                          key={b.id}
                          className={`text-center ${b.id === bestAge ? "bg-green-50 dark:bg-green-950 font-bold" : ""}`}
                        >
                          {b.age ? `${b.age} years` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Price</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center">
                          {b.price ? `$${b.price.toFixed(2)}` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Overall Rating</TableCell>
                      {compareData.map((b) => (
                        <TableCell
                          key={b.id}
                          className={`text-center ${b.id === bestOverall ? "bg-green-50 dark:bg-green-950 font-bold" : ""}`}
                        >
                          {b.avgRating !== null ? `${b.avgRating.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Review Count</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center">
                          {b.reviewCount}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Value Score</TableCell>
                      {compareData.map((b) => (
                        <TableCell
                          key={b.id}
                          className={`text-center ${b.id === bestValue ? "bg-green-50 dark:bg-green-950 font-bold" : ""}`}
                        >
                          {b.valueScore !== null ? b.valueScore.toFixed(1) : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Appearance</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center text-muted-foreground">
                          {b.categoryScores.appearance !== null ? `${b.categoryScores.appearance.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Nose</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center text-muted-foreground">
                          {b.categoryScores.nose !== null ? `${b.categoryScores.nose.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Taste</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center text-muted-foreground">
                          {b.categoryScores.taste !== null ? `${b.categoryScores.taste.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mouthfeel</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center text-muted-foreground">
                          {b.categoryScores.mouthfeel !== null ? `${b.categoryScores.mouthfeel.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Finish</TableCell>
                      {compareData.map((b) => (
                        <TableCell key={b.id} className="text-center text-muted-foreground">
                          {b.categoryScores.finish !== null ? `${b.categoryScores.finish.toFixed(1)}/10` : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Green highlights indicate the best value for each metric.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
