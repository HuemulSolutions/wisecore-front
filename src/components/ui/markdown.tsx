import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // permite interpretar <br> y HTML simple

interface MarkdownProps {
  children: string;
}

// Function to generate ID from heading text (same as in library.tsx)
const generateHeadingId = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// Function to extract text content from React children
const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (React.isValidElement(children) && (children.props as any).children) {
    return extractTextFromChildren((children.props as any).children);
  }
  return children?.toString() || '';
};

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return (
    <div className="w-full overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => (
            <table className="w-full border border-gray-300 border-collapse text-sm my-4">{children}</table>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-900 text-white">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-gray-200 last:border-0 even:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold border-r border-gray-700/40 last:border-0">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top border-r border-gray-200 last:border-0">{children}</td>
          ),
          h1: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h1 id={id} className="text-2xl font-bold mb-4">{children}</h1>;
          },
          h2: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h2 id={id} className="text-xl font-bold mb-3">{children}</h2>;
          },
          h3: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h3 id={id} className="text-lg font-bold mb-2">{children}</h3>;
          },
          h4: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h4 id={id} className="text-base font-bold mb-2">{children}</h4>;
          },
          h5: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h5 id={id} className="text-sm font-bold mb-2">{children}</h5>;
          },
          h6: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateHeadingId(text);
            return <h6 id={id} className="text-xs font-bold mb-2">{children}</h6>;
          },
          p: ({ children }) => (
            <p className="text-sm leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc text-sm ml-6 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal text-sm ml-6 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4">{children}</blockquote>
          ),
          code: (props: { inline?: boolean; children?: React.ReactNode }) => {
            const { inline, children } = props;
            if (inline) {
              return (
                <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>
              );
            }
            return (
              <div className="relative">
                <code className="block bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto text-sm text-white">{children}</code>
              </div>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;