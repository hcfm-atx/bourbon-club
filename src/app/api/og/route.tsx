import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "bourbon";
    const id = searchParams.get("id");
    const title = searchParams.get("title") || "Bourbon Club";
    const subtitle = searchParams.get("subtitle") || "";
    const rating = searchParams.get("rating") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #D97706 0%, #92400E 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Glass morphism overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            }}
          />

          {/* Content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              textAlign: "center",
              zIndex: 1,
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: "120px",
                marginBottom: "32px",
              }}
            >
              🥃
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
                marginBottom: "24px",
                maxWidth: "900px",
                lineHeight: 1.2,
                textShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p
                style={{
                  fontSize: "36px",
                  color: "rgba(255,255,255,0.9)",
                  margin: 0,
                  marginBottom: "24px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {subtitle}
              </p>
            )}

            {/* Rating */}
            {rating && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "white",
                  background: "rgba(0,0,0,0.3)",
                  padding: "16px 32px",
                  borderRadius: "16px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span>⭐</span>
                <span>{rating}/10</span>
              </div>
            )}

            {/* Footer badge */}
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                color: "rgba(255,255,255,0.8)",
                background: "rgba(0,0,0,0.2)",
                padding: "12px 24px",
                borderRadius: "999px",
                backdropFilter: "blur(10px)",
              }}
            >
              <span>🥃</span>
              <span>Bourbon Club</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
