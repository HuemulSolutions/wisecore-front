import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** ------- Helpers (idénticos a tu Markdown.tsx) ------- */
const generateHeadingId = (text: string, sectionIndex?: number): string => {
  const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return sectionIndex !== undefined ? `section-${sectionIndex}-${baseId}` : baseId;
};

const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (React.isValidElement(children) && (children.props as any).children) {
    return extractTextFromChildren((children.props as any).children);
  }
  return children?.toString() || "";
};

function normalize(s: string) {
  return (s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function stripMarkdownToText(input: string) {
  return (input ?? "")
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // headings, bold/italic, code
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    // links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // tablas: pipes a separadores simples
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickSegments(plain: string) {
  // corta por separadores típicos y elige segmentos “buenos”
  const rawParts = plain
    .split(/(\n|\.|;|\||:|\-|\u2013|\u2014)/g) // separadores comunes
    .map((s) => s.trim())
    .filter(Boolean);

  // segmentos útiles (evitar palabras muy cortas)
  const parts = rawParts
    .filter((p) => p.length >= 6)
    // evita segmentos demasiado largos
    .map((p) => (p.length > 120 ? p.slice(0, 120) : p));

  // prioriza: frases con 2+ palabras o con ":" (labels tipo Eslabón:)
  const scored = parts
    .map((p) => {
      const words = p.split(/\s+/).length;
      const score = (p.includes(":") ? 3 : 0) + Math.min(words, 6);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  // toma top 6 sin duplicados
  const out: string[] = [];
  for (const it of scored) {
    const key = it.p.toLowerCase();
    if (!out.some((x) => x.toLowerCase() === key)) out.push(it.p);
    if (out.length >= 6) break;
  }
  return out;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Intenta obtener un "anchor" reutilizable desde el fragmento:
 * - RP0001 / AP001 / ABC-123 / N° 3 / etc.
 * (Si no encuentra, retorna null y solo hace highlight inline por texto)
 */
function extractAnchorToken(fragment: string): string | null {
  const f = fragment ?? "";
  const codeLike = f.match(/\b[A-Z]{2,10}[-_]?\d{1,6}\b/g);
  if (codeLike?.length) return codeLike[0];
  const numLike = f.match(/\b(N°|Nº|No\.?)\s*\d+\b/i);
  if (numLike?.length) return numLike[0];
  const uuid = f.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  if (uuid?.length) return uuid[0];
  return null;
}

/** Extrae el título de un heading desde el fragmento (ej: "## 1 Posicionamiento" -> "1 Posicionamiento") */
function extractHeadingTitle(fragment: string): string | null {
  const m = (fragment ?? "").replace(/\\n/g, "\n").match(/^#{1,6}\s*([^\n]+)/m);
  return m ? m[1].trim() : null;
}

/** Arma una lista de "needles" para marcar inline */
function buildNeedles(fragment: string) {
  const anchor = extractAnchorToken(fragment);
  const heading = extractHeadingTitle(fragment);
  const plain = stripMarkdownToText(fragment);

  const needles = [...(anchor ? [anchor] : []), ...(heading ? [heading] : []), ...pickSegments(plain)];

  // dedupe + evita cosas muy cortas
  const unique = Array.from(new Set(needles.map((n) => n.trim()).filter((n) => n.length >= 4)));

  return { needles: unique, anchor };
}

/** Divide un string y envuelve coincidencias con <mark> */
function highlightText(text: string, needles: string[], caseInsensitive = true): React.ReactNode {
  if (!text || needles.length === 0) return text;

  // Filtra needles demasiado cortos para evitar ruido (ej: "de", "y", etc.)
  const filtered = needles.filter((n) => n.length >= 4);
  if (filtered.length === 0) return text;

  const pattern = filtered.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, caseInsensitive ? "gi" : "g");

  const parts = text.split(re);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    // IMPORTANTE: no uses re.test(part) aquí porque el /g mantiene estado.
    const re2 = new RegExp(`^(${pattern})$`, caseInsensitive ? "i" : "");
    if (re2.test(part)) {
      return (
        <mark
          key={i}
          className="rounded-md bg-amber-200 px-1 py-0.5 text-amber-950 ring-1 ring-amber-400/60"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Recorre children y resalta solo nodos de texto, sin romper estructura */
function highlightChildren(children: React.ReactNode, needles: string[]): React.ReactNode {
  if (children == null) return children;

  if (typeof children === "string") {
    return highlightText(children, needles, true);
  }

  if (Array.isArray(children)) {
    return children.map((c, idx) => <React.Fragment key={idx}>{highlightChildren(c, needles)}</React.Fragment>);
  }

  if (React.isValidElement(children)) {
    const props = (children.props as any) ?? {};
    if (!props.children) return children;

    return React.cloneElement(children, {
      ...props,
      children: highlightChildren(props.children, needles),
    });
  }

  return children;
}

function headingIsHighlighted(headingText: string, needles: string[]) {
  const t = (headingText ?? "").toLowerCase();
  return needles.some((n) => t.includes(n.toLowerCase()));
}

type HighlightedMarkdownProps = {
  /** Markdown completo */
  markdown: string;

  /** Fragmento a destacar (texto tal como viene desde tu API) */
  highlightFragment: string;

  /** Título opcional (del Card, no del markdown) */
  title?: string;

  /** Igual que tu Markdown.tsx */
  sectionIndex?: number;

  /** Para reutilizar sin Card */
  withCard?: boolean;

  /** Clases */
  className?: string;
};

export default function HighlightedMarkdown({
  markdown,
  highlightFragment,
  title,
  sectionIndex,
  withCard = true,
  className,
}: HighlightedMarkdownProps) {
  // Tu mismo fix: si viene con "\\n"
  const displayedContent = React.useMemo(() => (markdown ?? "").replace(/\\n/g, "\n"), [markdown]);

  const { needles, anchor } = React.useMemo(() => buildNeedles(highlightFragment ?? ""), [highlightFragment]);

  // Para resaltar filas: si tenemos anchor, lo usamos. Si no, usamos un snippet (primer needle “decente”)
  const rowProbe = React.useMemo(() => {
    if (anchor) return anchor.toLowerCase();
    const snippet = needles.find((n) => n && n.length >= 10);
    return snippet ? snippet.toLowerCase() : null;
  }, [anchor, needles]);

  const content = (
    <div className="w-full max-w-full overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => (
            <table className="w-full border border-gray-300 border-collapse text-sm my-4">{children}</table>
          ),
          thead: ({ children }) => <thead className="bg-gray-900 text-white">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,

          tr: ({ children }) => {
            const rowText = normalize(extractTextFromChildren(children)).toLowerCase();
            const isHighlighted = rowProbe ? rowText.includes(rowProbe) : false;

            return (
              <tr
                className={[
                  "border-b border-gray-200 last:border-0 even:bg-gray-50",
                  isHighlighted ? "bg-amber-100/70 ring-1 ring-amber-400/70" : "",
                ].join(" ")}
              >
                {children}
              </tr>
            );
          },

          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold border-r border-gray-700/40 last:border-0">
              {highlightChildren(children, needles)}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top border-r border-gray-200 last:border-0">
              {highlightChildren(children, needles)}
            </td>
          ),

          h1: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h1
                id={id}
                className={[
                  "text-2xl font-bold my-4",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h1>
            );
          },
          h2: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h2
                id={id}
                className={[
                  "text-xl font-bold my-3",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h3
                id={id}
                className={[
                  "text-lg font-bold my-2",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h3>
            );
          },
          h4: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h4
                id={id}
                className={[
                  "text-base font-bold my-2",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h4>
            );
          },
          h5: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h5
                id={id}
                className={[
                  "text-sm font-bold my-2",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h5>
            );
          },
          h6: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text, sectionIndex);
            const isH = headingIsHighlighted(text, needles);
            return (
              <h6
                id={id}
                className={[
                  "text-xs font-bold my-2",
                  isH ? "bg-amber-100/70 ring-1 ring-amber-400/70 rounded-md px-2 py-1" : "",
                ].join(" ")}
              >
                {highlightChildren(children, needles)}
              </h6>
            );
          },

          p: ({ children }) => <p className="text-sm leading-loose">{highlightChildren(children, needles)}</p>,
          ul: ({ children }) => <ul className="list-disc text-sm ml-6 mb-2 space-y-1 leading-loose">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal text-sm ml-6 mb-2 space-y-1 leading-loose">{children}</ol>,
          li: ({ children }) => <li className="text-sm mb-1 leading-loose">{highlightChildren(children, needles)}</li>,

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4">
              {highlightChildren(children, needles)}
            </blockquote>
          ),

          code: (props: { inline?: boolean; children?: React.ReactNode }) => {
            const { inline, children } = props;
            if (inline) return <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>;
            return (
              <code className="block bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto text-sm text-white">
                {children}
              </code>
            );
          },
        }}
      >
        {displayedContent}
      </ReactMarkdown>
    </div>
  );

  if (!withCard) return <div className={className}>{content}</div>;

  return (
    <Card className={className}>
      {title ? (
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>{content}</CardContent>
    </Card>
  );
}
