import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { MenuSection } from "./types";

const GridMenu = ({ menuItems }: { menuItems: MenuSection[] }) => {
  return (
    <div className="flex flex-col flex-wrap items-center justify-start gap-2 space-y-4 p-0 md:flex-row md:items-start md:gap-4 md:px-4">
      {menuItems.map((section, i) => (
        <Card key={i}>
          <CardContent>
            {/* Section Title */}
            <h2 className="mb-4 text-lg font-semibold text-foreground/70">
              {section.module}
            </h2>

            {/* Grid of Links */}
            <div className="flex flex-col items-center justify-center space-y-8 lg:items-start">
              <div className="grid grid-cols-2 gap-3">
                {section.links.map((link) => {
                  if (link.type === "live") {
                    const LiveComponent = link.component;

                    return (
                      <LiveComponent
                        key={link.name}
                        name={link.name}
                        path={link.path}
                        title={link.title}
                        icon={link.icon}
                      />
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      title={link.title}
                      href={link.path}
                      className="group"
                    >
                      <Card className="flex h-32 w-32 flex-col items-center justify-center rounded-2xl border transition-all hover:border-primary/50 hover:shadow-lg sm:w-36">
                        <CardContent className="flex flex-col items-center space-y-2 p-3">
                          <link.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                          <span className="text-center text-sm font-medium group-hover:text-primary">
                            {link.name}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GridMenu;
