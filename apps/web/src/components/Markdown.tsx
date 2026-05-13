import { useMemo } from "react";
import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function Markdown({ content }: { content: string }) {
  const html = useMemo(() => marked.parse(content) as string, [content]);

  return (
    <div
      className="prose prose-sm prose-invert prose-purple max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent prose-strong:text-text-primary prose-code:text-accent prose-code:bg-surface-tertiary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-tertiary prose-pre:border prose-pre:border-border-primary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
