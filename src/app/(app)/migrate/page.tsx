"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MigratePage() {
  const [result, setResult] = useState<{ ok?: boolean; log?: string[] } | null>(null);
  const [running, setRunning] = useState(false);

  const runMigration = async () => {
    setRunning(true);
    const res = await fetch("/api/migrate", { method: "POST" });
    const data = await res.json();
    setResult(data);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Migration</h1>
      <Card>
        <CardHeader>
          <CardTitle>Migrate to Multi-Club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This creates a default club and migrates all existing data into it. Safe to run multiple times.
          </p>
          <Button onClick={runMigration} disabled={running}>
            {running ? "Running..." : "Run Migration"}
          </Button>
          {result && (
            <div className="bg-muted rounded-md p-4 text-sm space-y-1">
              {result.log?.map((line, i) => <p key={i}>{line}</p>)}
              {result.ok && <p className="font-bold mt-2">Migration complete!</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
