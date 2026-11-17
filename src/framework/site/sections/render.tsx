import type { AnySectionDef } from "./registry";
import { getSection } from "./registry";
import type { StoredSection } from "./content";
import { SectionScope } from "./primitives";

/** Renders one registered section inside its editing scope. Works on the server and in the editor. */
export function RenderSection({
  def,
  id,
  content,
  data,
  edit,
  errors,
}: {
  def: AnySectionDef;
  id: string;
  content: unknown;
  data?: unknown;
  edit: boolean;
  /** Validation messages by content path (editor only). */
  errors?: Record<string, string>;
}) {
  const Component = def.component;
  return (
    <SectionScope sectionId={id} content={content} edit={edit} errors={errors}>
      <Component id={id} content={content} data={data} edit={edit} />
    </SectionScope>
  );
}

/**
 * Renders the visible sections of a page in order. `data` holds each section
 * type's loader result (see loadSectionData); `edit` turns on inline editing
 * (CMS editor only), and `errors` marks invalid texts there, by section id.
 */
export function RenderSections({
  sections,
  data = {},
  edit = false,
  errors,
}: {
  sections: readonly StoredSection[];
  data?: Record<string, unknown>;
  edit?: boolean;
  errors?: Record<string, Record<string, string>>;
}) {
  return (
    <>
      {sections
        .filter((section) => !section.hidden)
        .map((section) => {
          const def = getSection(section.type);
          return def ? (
            <RenderSection
              key={section.id}
              def={def}
              id={section.id}
              content={section.content}
              data={data[section.type]}
              edit={edit}
              errors={errors?.[section.id]}
            />
          ) : null;
        })}
    </>
  );
}
