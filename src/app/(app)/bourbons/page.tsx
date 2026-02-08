"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

export default function BourbonsPage() {
  const [bourbons, setBourbons] = useState<Bourbon[]>([]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/bourbons").then((r) => r.json()).then(setBourbons);
  }, []);

  const filtered = bourbons.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.distillery?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bourbons</h1>
      </div>
      <Input
        placeholder="Search by name or distillery..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bourbon) => (
          <Card key={bourbon.id} className="hover:shadow-md transition-shadow h-full">
            {bourbon.imageUrl && (
              <div
                className="relative h-48 w-full cursor-zoom-in"
                onClick={() => setPreviewImage({ url: bourbon.imageUrl!, name: bourbon.name })}
              >
                <Image
                  src={bourbon.imageUrl}
                  alt={bourbon.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <Link href={`/bourbons/${bourbon.id}`}>
              <CardHeader>
                <CardTitle className="text-lg">{bourbon.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {bourbon.distillery || "Unknown distillery"}
                  {bourbon.proof && ` — ${bourbon.proof}°`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{bourbon.type.replace("_", " ")}</Badge>
                  {bourbon.avgRating !== null && (
                    <Badge variant="outline">{bourbon.avgRating.toFixed(1)}/10 ({bourbon.reviewCount})</Badge>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground">No bourbons found.</p>}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full">
            <Image
              src={previewImage.url}
              alt={previewImage.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
