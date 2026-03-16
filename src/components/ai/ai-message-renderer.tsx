"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface AgentMessageRendererProps {
  content: string;
  className?: string;
}

export function AgentMessageRenderer({
  content,
  className,
}: AgentMessageRendererProps) {
  if (!content) return null;

  // Pre-process: convert [Attached image: URL] patterns to markdown images
  const processedContent = content.replace(
    /\[Attached image:\s*(https?:\/\/[^\]]+)\]/g,
    "![]($1)"
  );

  return (
    <div className={cn("agent-prose text-sm leading-relaxed", className)}>
      <Markdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <pre className="my-2 overflow-x-auto rounded-md bg-black/5 dark:bg-white/5 p-2.5 text-xs">
                  <code className="font-mono">{children}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-black/5 dark:bg-white/10 px-1 py-0.5 text-xs font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-md border">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t px-2 py-1.5">{children}</td>
          ),
          img: ({ src, alt }) => (
            <ProductImage src={typeof src === "string" ? src : undefined} alt={alt} />
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-muted-foreground/20" />,
          h3: ({ children }) => (
            <h3 className="mb-1 mt-3 text-sm font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-2 text-sm font-medium first:mt-0">
              {children}
            </h4>
          ),
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
}

/** Inline image component for AI chat with loading state and lightbox */
function ProductImage({ src, alt }: { src?: string; alt?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const resolvedSrc = resolveImageUrl(src);
  if (!resolvedSrc) return null;
  if (error) return null;

  return (
    <>
      <span className="my-2 block">
        <span
          className={cn(
            "relative block overflow-hidden rounded-lg border border-border/50 cursor-pointer",
            "transition-all duration-200 hover:border-border hover:shadow-sm",
            !loaded && "animate-pulse bg-muted h-32"
          )}
          onClick={() => setExpanded(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedSrc}
            alt={alt || "Product image"}
            className={cn(
              "max-h-48 w-auto rounded-lg object-contain",
              loaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </span>
        {alt && (
          <span className="mt-1 block text-[10px] text-muted-foreground truncate">
            {alt}
          </span>
        )}
      </span>

      {/* Lightbox */}
      {expanded && (
        <span
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <span className="relative max-h-[85vh] max-w-[85vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedSrc}
              alt={alt || "Product image"}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
            />
            <a
              href={resolvedSrc}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </a>
          </span>
        </span>
      )}
    </>
  );
}
