"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RatingBarChart } from "@/components/ratings/rating-bar-chart";
import { RatingScatterPlot } from "@/components/ratings/rating-scatter-plot";
import { RatingRadarChart } from "@/components/ratings/rating-radar-chart";
import { MemberHistory } from "@/components/ratings/member-history";

interface BourbonRating {
  id: string;
  name: string;
  distillery: string | null;
  type: string;
  proof: number | null;
  cost: number | null;
  region: string | null;
  age: number | null;
  avgRating: number;
  minRating: number;
  maxRating: number;
  reviewCount: number;
  reviews: {
    id: string;
    rating: number;
    nose: string | null;
    palate: string | null;
    finish: string | null;
    notes: string | null;
    userId: string;
    userName: string;
    meetingDate?: string;
    meetingTitle?: string;
  }[];
}

interface FilterOptions {
  distilleries: string[];
  types: string[];
  regions: string[];
}

export default function RatingsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<BourbonRating[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ distilleries: [], types: [], regions: [] });
  const [distillery, setDistillery] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [scatterAxis, setScatterAxis] = useState<"cost" | "proof">("cost");

  useEffect(() => {
    const params = new URLSearchParams();
    if (distillery) params.set("distillery", distillery);
    if (type) params.set("type", type);
    if (region) params.set("region", region);

    fetch(`/api/ratings?${params}`).then((r) => r.json()).then((res) => {
      setData(res.bourbons || []);
      setFilterOptions(res.filterOptions || { distilleries: [], types: [], regions: [] });
    });
  }, [distillery, type, region]);

  const [myData, setMyData] = useState<BourbonRating[]>([]);
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/ratings?userId=${session.user.id}`).then((r) => r.json()).then((res) => {
      setMyData(res.bourbons || []);
    });
  }, [session?.user?.id]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const compareBourbons = data.filter((b) => compareIds.has(b.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ratings</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Distillery</Label>
              <Select value={distillery} onValueChange={setDistillery}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterOptions.distilleries.map((d) => (
                    <SelectItem key={d} value={d!}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterOptions.types.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filterOptions.regions.map((r) => (
                    <SelectItem key={r} value={r!}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Top Rated Bourbons</CardTitle></CardHeader>
            <CardContent>
              <RatingBarChart data={data} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rating vs {scatterAxis === "cost" ? "Cost" : "Proof"}</CardTitle>
                <Select value={scatterAxis} onValueChange={(v) => setScatterAxis(v as "cost" | "proof")}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost">Cost</SelectItem>
                    <SelectItem value="proof">Proof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <RatingScatterPlot data={data} xAxis={scatterAxis} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Select Bourbons to Compare (up to 4)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {data.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={compareIds.has(b.id)}
                      onCheckedChange={() => toggleCompare(b.id)}
                      disabled={!compareIds.has(b.id) && compareIds.size >= 4}
                    />
                    <span className="text-sm">{b.name} ({b.avgRating.toFixed(1)})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {compareBourbons.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Comparison</CardTitle></CardHeader>
              <CardContent>
                <RatingRadarChart bourbons={compareBourbons} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>My Ratings Over Time</CardTitle></CardHeader>
            <CardContent>
              <MemberHistory data={myData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>My Reviews</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myData.map((b) =>
                  b.reviews.map((r) => (
                    <div key={r.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-sm font-bold">{r.rating}/10</span>
                      </div>
                      {r.meetingTitle && (
                        <p className="text-xs text-muted-foreground">
                          {r.meetingTitle} — {r.meetingDate ? new Date(r.meetingDate).toLocaleDateString() : ""}
                        </p>
                      )}
                    </div>
                  ))
                )}
                {myData.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
