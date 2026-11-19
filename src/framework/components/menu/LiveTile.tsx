import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/framework/lib/utils";
import { Link } from "@/i18n/navigation";
import type { LiveTileProps } from "./types";
import { Badge } from "@/components/ui/badge";
import { formatLiveNumber } from "./LiveNumber";

/** A menu tile with a live number in its corner (none while it's unknown). */
const LiveTile = ({
  title,
  path,
  name,
  icon: Icon,
  liveNumber,
  className,
}: LiveTileProps) => {
  return (
    <Link title={title} href={path} key={name} className="group">
      <Card className="relative flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-lg sm:w-36">
        {liveNumber !== undefined && (
          <Badge variant="default" className="absolute top-2 right-2 tabular-nums">
            {formatLiveNumber(liveNumber)}
          </Badge>
        )}

        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 p-0">
          <Icon className="h-8 w-8 shrink-0 text-primary transition-transform group-hover:scale-110" />
          <span
            className={cn(
              "line-clamp-2 text-center text-sm leading-tight font-medium transition-colors group-hover:text-primary",
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
