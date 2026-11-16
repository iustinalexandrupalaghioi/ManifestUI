import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CodeLines } from "../landing/highlight";

/** Plain text of a heading, for its anchor id. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const id = slugify(textOf(children));
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag
      id={id}
      className={cn(
        "group scroll-mt-24 font-display font-semibold tracking-tight",
        level === 2 ? "mt-12 mb-4 text-2xl" : "mt-8 mb-3 text-lg",
      )}
    >
      {children}
      <a
        href={`#${id}`}
        aria-hidden
        tabIndex={-1}
        className="ml-2 text-muted-foreground no-underline opacity-0 transition-opacity group-hover:opacity-100"
      >
        #
      </a>
    </Tag>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 font-display text-[clamp(30px,4vw,40px)] leading-tight font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p: ({ children }) => <p className="my-4 text-base leading-7 text-foreground/85">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 leading-7 text-foreground/85">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 leading-7 text-foreground/85">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-muted-foreground">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  hr: () => <hr className="my-10 border-border" />,
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
        {children}
      </Link>
    ) : (
      <a
        href={href}
        className="font-medium text-primary underline-offset-4 hover:underline"
        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </a>
    ),
  blockquote: ({ children }) => (
    <aside className="my-6 rounded-r-lg border-l-4 border-primary bg-accent/50 px-4 py-1 text-foreground/90 [&_p]:my-3">
      {children}
    </aside>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => <th className="border-b px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b px-3 py-2 align-top last:border-b-0">{children}</td>,
  // Block code is rendered by `code`; `pre` only passes it through.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }: ComponentProps<"code">) => {
    const text = String(children ?? "");
    const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
    if (!language && !text.includes("\n")) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground">{children}</code>
      );
    }
    return (
      <div className="my-5 overflow-hidden rounded-xl bg-brand-ink">
        {language && (
          <div className="border-b border-[#1E3038] px-4 py-2 font-mono text-xs text-[#8FB3BE]">{language}</div>
        )}
        <pre className="m-0 overflow-x-auto p-4 font-mono text-[13px] leading-6">
          <CodeLines code={text.replace(/\n$/, "")} />
        </pre>
      </div>
    );
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  );
}

/** `## ` headings of a lesson, for its "On this page" list. */
export function lessonHeadings(source: string) {
  return [...source.matchAll(/^## (.+)$/gm)].map(([, text]) => {
    const plain = text.replace(/`/g, "").trim();
    return { text: plain, id: slugify(plain) };
  });
}
