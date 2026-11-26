import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { FolderIcon } from "lucide-react";
import { sectionLinks, type MenuLink, type MenuSection } from "./types";
import { LiveNumber } from "./LiveNumber";
import LiveTile from "./LiveTile";

/** One tile: a live tile with its badge, or a plain link tile. */
function Tile({ link }: { link: MenuLink }) {
  if (link.type === "live") {
    return (
      <LiveNumber use={link.useLiveNumber}>
        {(value) => <LiveTile name={link.name} path={link.path} title={link.title} icon={link.icon} liveNumber={value} />}
      </LiveNumber>
    );
  }
  return (
    <Link title={link.title} href={link.path} className="group">
      <Card className="flex h-32 w-32 flex-col items-center justify-center rounded-2xl border transition-all hover:border-primary/50 hover:shadow-lg sm:w-36">
        <CardContent className="flex flex-col items-center space-y-2 p-3">
          <link.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
          <span className="text-center text-sm font-medium group-hover:text-primary">{link.name}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function Tiles({ links }: { links: MenuLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {links.map((link) => (
        <Tile key={link.path} link={link} />
      ))}
    </div>
  );
}

/** A folder section's tile in the CMS home: the section's name, opening its own page. */
function FolderTile({ section, href }: { section: MenuSection; href: string }) {
  const count = sectionLinks(section).length;
  return (
    <Link href={href} title={section.groups?.map((group) => group.name).join(" · ")} className="group">
      <Card className="flex h-32 w-32 flex-col items-center justify-center rounded-2xl border transition-all hover:border-primary/50 hover:shadow-lg sm:w-36">
        <CardContent className="flex flex-col items-center space-y-2 p-3">
          <span className="relative">
            <FolderIcon aria-hidden className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <span className="absolute -top-2 -right-3 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {count}
            </span>
          </span>
          <span className="text-center text-sm font-medium group-hover:text-primary">{section.module}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * The CMS home: one card per section with its tiles. A section's groups (e.g. Content › Blog,
 * Portfolio, Website) each get a heading and their own tiles, side by side where there's room.
 * With `folderHref`, a section marked `folder` keeps its card but shows one folder tile (its
 * groups behind it) beside its direct links; the folder's page shows the groups as sections
 * (see `folderSections`).
 */
const GridMenu = ({ menuItems, folderHref }: { menuItems: MenuSection[]; folderHref?: (folder: string) => string }) => {
  return (
    <div className="flex flex-col flex-wrap items-center justify-start gap-2 space-y-4 px-4 py-6 md:flex-row md:items-start md:gap-4 md:px-6">
      {menuItems.map((section, i) => {
        const asFolder = Boolean(folderHref && section.folder);
        return (
        <Card key={i}>
          <CardContent>
            <h2 className="mb-4 text-lg font-semibold text-foreground/70">{section.module}</h2>

            <div className="flex flex-col items-center gap-6 lg:items-start">
              {asFolder ? (
                <div className="grid grid-cols-2 gap-3">
                  <FolderTile section={section} href={folderHref!(section.folder!)} />
                  {section.links.map((link) => (
                    <Tile key={link.path} link={link} />
                  ))}
                </div>
              ) : (
                section.links.length > 0 && <Tiles links={section.links} />
              )}
              {!asFolder && section.groups?.length ? (
                <div className="flex flex-col flex-wrap items-center gap-x-8 gap-y-6 lg:flex-row lg:items-start">
                  {section.groups.map((group) => (
                    <section key={group.name} aria-label={group.name} className="flex flex-col gap-3">
                      <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{group.name}</h3>
                      <Tiles links={group.links} />
                    </section>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
};

export default GridMenu;
