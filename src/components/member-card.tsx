import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MemberCardProps {
  member: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    role?: string;
    reviewCount?: number;
    meetingCount?: number;
    currentStreak?: number;
    favoriteBourbon?: {
      name: string;
      rating: number;
    } | null;
  };
}

export function MemberCard({ member }: MemberCardProps) {
  const getUserInitials = (name: string | null, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
      }
      return name.trim()[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const initials = getUserInitials(member.name, member.email);
  const joinDate = new Date(member.createdAt);
  const monthsSinceJoined = Math.floor(
    (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">
                {member.name || member.email}
              </h3>
              {member.role && (
                <Badge
                  variant={member.role === "ADMIN" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {member.role}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Member for{" "}
              {monthsSinceJoined > 0
                ? `${monthsSinceJoined} month${monthsSinceJoined !== 1 ? "s" : ""}`
                : "less than a month"}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div>
                <p className="font-bold text-lg">{member.reviewCount ?? 0}</p>
                <p className="text-muted-foreground">Reviews</p>
              </div>
              <div>
                <p className="font-bold text-lg">{member.meetingCount ?? 0}</p>
                <p className="text-muted-foreground">Meetings</p>
              </div>
              <div>
                <p className="font-bold text-lg text-orange-600">
                  {member.currentStreak ?? 0}
                </p>
                <p className="text-muted-foreground">Streak</p>
              </div>
            </div>
            {member.favoriteBourbon && (
              <div className="pt-2 border-t text-xs">
                <p className="text-muted-foreground">Favorite Bourbon</p>
                <p className="font-medium truncate">
                  {member.favoriteBourbon.name}{" "}
                  <span className="text-amber-600">
                    ({member.favoriteBourbon.rating.toFixed(1)}/10)
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
