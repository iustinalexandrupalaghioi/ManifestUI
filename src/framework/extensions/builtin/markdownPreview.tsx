"use client";

import type { ComponentType } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownRenderer = ComponentType<{ source: string }>;

/** A plain renderer, used until the project registers its own. */
function DefaultMarkdown({ source }: { source: string }) {
  return (
    <div className="space-y-3 py-4 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_code]:font-mono [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}

let renderer: MarkdownRenderer = DefaultMarkdown;

/**
 * The Markdown editor's preview. Register the website's own renderer
 * (in src/components/extensions/index.ts) so the preview looks like the published page.
 */
export function setMarkdownRenderer(component: MarkdownRenderer) {
  renderer = component;
}

export function MarkdownPreview({ source }: { source: string }) {
  const Renderer = renderer;
  return <Renderer source={source} />;
}
