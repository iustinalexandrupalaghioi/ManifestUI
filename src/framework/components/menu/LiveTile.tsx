import { Card, CardContent } from "@/framework/components/ui/card";
import { cn } from "@/framework/lib/utils";
import Link from "next/link";
import type { LiveTileProps } from "./types";
import { Badge } from "@/framework/components/ui/badge";

const LiveTile = ({
  title,
  path,
  name,
  icon: Icon,
  liveNumber,
  className,
}: LiveTileProps) => {
  const displayCount = liveNumber > 500 ? "500+" : liveNumber;

  return (
    <Link title={title} href={path} key={name} className="group">
      <Card className="relative flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-lg sm:w-36">
        <Badge
          variant="default"
          className={cn("absolute top-2 right-2 tabular-nums")}
        >
          {displayCount}
        </Badge>

        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 p-0">
          <Icon className="h-8 w-8 shrink-0 text-primary transition-transform group-hover:scale-110" />
          <span
            className={cn(
              "line-clamp-2 text-center  leading-tight font-medium transition-colors group-hover:text-primary",
              className,
            )}
          >
            {name}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LiveTile;
