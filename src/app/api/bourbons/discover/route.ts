import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const clubId = await getClubId(session.user.id, session.user.currentClubId);
  if (!clubId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "1000");
  const minProof = parseFloat(searchParams.get("minProof") || "0");
  const maxProof = parseFloat(searchParams.get("maxProof") || "200");
  const flavor = searchParams.get("flavor") || "";
  const experience = searchParams.get("experience") || "";

  const bourbons = await prisma.bourbon.findMany({
    where: {
      clubId,
    },
    include: {
      reviews: {
        select: {
          rating: true,
          nose: true,
          palate: true,
          finish: true,
          notes: true,
        }
      },
    },
  });

  // Calculate scores for each bourbon based on criteria
  const scoredBourbons = bourbons.map((b) => {
    const ratings = b.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    // Price range score (bonus if in range, neutral if no price set)
    let priceScore = 0;
    if (b.price != null) {
      if (b.price >= minPrice && b.price <= maxPrice) {
        priceScore = 3; // Matches preferred price range
      }
    } else {
      priceScore = 1; // Neutral for unknown price
    }

    // Proof range score (bonus if in range, neutral if no proof set)
    let proofScore = 0;
    if (b.proof != null) {
      if (b.proof >= minProof && b.proof <= maxProof) {
        proofScore = 3; // Matches preferred proof range
      }
    } else {
      proofScore = 1; // Neutral for unknown proof
    }

    // Flavor matching score
    let flavorScore = 0;
    if (flavor && b.reviews.length > 0) {
      const allNotes = b.reviews
        .map(r => [r.nose, r.palate, r.finish, r.notes].filter(Boolean).join(" "))
        .join(" ")
        .toLowerCase();

      const flavorKeywords: Record<string, string[]> = {
        sweet: ["vanilla", "caramel", "honey", "butterscotch", "toffee", "brown sugar", "maple", "sweet"],
        spicy: ["cinnamon", "pepper", "spice", "rye", "clove", "nutmeg", "heat", "warm"],
        fruity: ["cherry", "apple", "pear", "orange", "citrus", "berry", "dried fruit", "fruit"],
        oaky: ["oak", "wood", "cedar", "char", "smoke", "tobacco", "leather", "woody"],
      };

      const keywords = flavorKeywords[flavor] || [];
      flavorScore = keywords.filter(kw => allNotes.includes(kw)).length;
    } else if (flavor) {
      // No reviews but flavor selected - give small neutral score
      flavorScore = 0;
    }

    // Experience level score
    let experienceScore = 0;
    if (experience === "beginner") {
      experienceScore = (b.proof && b.proof < 100 ? 2 : 1) + (avgRating > 7 ? 2 : 0);
    } else if (experience === "intermediate") {
      experienceScore = avgRating > 6 ? 2 : 1;
    } else if (experience === "expert") {
      experienceScore = (b.proof && b.proof >= 100 ? 2 : 0) + (b.reviews.length > 3 ? 1 : 0);
    }

    // Total score
    const totalScore = avgRating + flavorScore + experienceScore + priceScore + proofScore;

    return {
      id: b.id,
      name: b.name,
      distillery: b.distillery,
      proof: b.proof,
      price: b.price,
      age: b.age,
      type: b.type,
      imageUrl: b.imageUrl,
      avgRating: avgRating > 0 ? avgRating : null,
      reviewCount: b.reviews.length,
      matchScore: totalScore,
    };
  });

  // Sort by match score and return top matches
  const topMatches = scoredBourbons
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return NextResponse.json(topMatches);
}
