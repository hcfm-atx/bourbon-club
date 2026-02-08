"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Bourbon {
  id: string;
  name: string;
  distillery: string | null;
  type: string;
  proof: number | null;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export default function AdminBourbonsPage() {
  const [bourbons, setBourbons] = useState<Bourbon[]>([]);

  useEffect(() => {
    fetch("/api/bourbons").then((r) => r.json()).then(setBourbons);
  }, []);

  const deleteBourbon = async (id: string) => {
    if (!confirm("Delete this bourbon?")) return;
    const res = await fetch(`/api/bourbons/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBourbons((prev) => prev.filter((b) => b.id !== id));
      toast.success("Bourbon deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bourbons</h1>
        <Link href="/admin/bourbons/new">
          <Button>Add Bourbon</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bourbons.map((bourbon) => (
          <Card key={bourbon.id}>
            {bourbon.imageUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={bourbon.imageUrl}
                  alt={bourbon.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{bourbon.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {bourbon.distillery || "Unknown distillery"}
                {bourbon.proof && ` — ${bourbon.proof}°`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{bourbon.type}</Badge>
                {bourbon.avgRating && (
                  <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount})</Badge>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/admin/bourbons/${bourbon.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => deleteBourbon(bourbon.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {bourbons.length === 0 && <p className="text-muted-foreground">No bourbons yet.</p>}
      </div>
    </div>
  );
}
