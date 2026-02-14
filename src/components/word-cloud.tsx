"use client";

interface Review {
  nose: string | null;
  palate: string | null;
  finish: string | null;
  notes: string | null;
  appearanceNotes: string | null;
  mouthfeel: string | null;
}

interface WordCloudProps {
  reviews: Review[];
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
  "will", "with", "very", "quite", "some", "this", "i", "you", "but", "or",
  "so", "if", "my", "your", "all", "can", "just", "not", "there", "their",
  "get", "got", "little", "bit", "really", "much", "more", "no", "yes",
]);

export function WordCloud({ reviews }: WordCloudProps) {
  // Extract all review text
  const allText = reviews
    .flatMap((r) => [r.nose, r.palate, r.finish, r.notes, r.appearanceNotes, r.mouthfeel])
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    // Remove punctuation
    .replace(/[.,!?;:()]/g, " ");

  if (!allText.trim()) {
    return null;
  }

  // Count word frequency
  const words = allText.split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  const wordCounts = new Map<string, number>();

  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Sort by frequency and take top 30
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  if (sortedWords.length === 0) {
    return null;
  }

  const maxCount = sortedWords[0][1];
  const minCount = sortedWords[sortedWords.length - 1][1];

  // Generate font sizes (12px to 32px)
  const getFontSize = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount || 1);
    return 12 + normalized * 20;
  };

  // Generate amber color intensity
  const getColor = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount || 1);
    const opacity = 0.4 + normalized * 0.6;
    return `rgba(217, 119, 6, ${opacity})`;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 justify-center items-center p-4 min-h-[200px]">
        {sortedWords.map(([word, count]) => (
          <span
            key={word}
            className="font-medium transition-all hover:scale-110 cursor-default"
            style={{
              fontSize: `${getFontSize(count)}px`,
              color: getColor(count),
            }}
            title={`${count} mentions`}
          >
            {word}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Most common words from tasting notes
      </p>
    </div>
  );
}
