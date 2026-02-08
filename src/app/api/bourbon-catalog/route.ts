import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import catalog from "@/data/bourbon-catalog.json";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() || "";
  if (!q || q.length < 2) return NextResponse.json([]);

  const results = catalog
    .filter((b) => b.name.toLowerCase().includes(q) || (b.distillery && b.distillery.toLowerCase().includes(q)))
    .slice(0, 15);

  return NextResponse.json(results);
}
