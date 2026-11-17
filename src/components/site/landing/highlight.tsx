/**
 * A tiny TypeScript highlighter for the landing page's code samples: enough
 * for short snippets, with no dependency. Colours are the brand's code theme,
 * shown on surfaces that stay dark in both themes.
 */
const TOKEN =
  /(\/\/.*$|^[#$].*$)|("[^"]*")|\b(import|export|default|function|return|from|const|let|type|as|async|await|null|true|false)\b|([A-Za-z_$][\w$]*)(?=[(<])|([{}()[\].,:;=<>/|+])/gm;

const TOKEN_CLASS = [
  "text-[#6B8791]", // comment / terminal prompt
  "text-[#F2C48D]", // string
  "text-[#22A6C4]", // keyword
  "text-[#E6F1F4]", // call
  "text-[#7F9BA5]", // punctuation
];

const PLAIN = "text-[#C9DCE2]";

export function highlight(line: string): { text: string; className: string }[] {
  const parts: { text: string; className: string }[] = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: line.slice(last, index), className: PLAIN });
    const group = match.slice(1).findIndex((g) => g !== undefined);
    parts.push({ text: match[0], className: TOKEN_CLASS[group] ?? PLAIN });
    last = index + match[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), className: PLAIN });
  return parts;
}

/** Renders a highlighted multi-line snippet as `<code>` lines. */
export function CodeLines({ code }: { code: string }) {
  return code.split("\n").map((line, i) => (
    <code key={i} className="block whitespace-pre">
      {line === ""
        ? " "
        : highlight(line).map((part, j) => (
            <span key={j} className={part.className}>
              {part.text}
            </span>
          ))}
    </code>
  ));
}
