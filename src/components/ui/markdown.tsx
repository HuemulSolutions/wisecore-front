import React from 'react';
import ReactMarkdown from 'react-markdown';


interface MarkdownProps {
  children: string;
}

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  
  return (
    <div>
      <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold mb-2">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-bold mb-2">{children}</h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-sm font-bold mb-2">{children}</h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-xs font-bold mb-2">{children}</h6>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc text-sm ml-6 mb-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal text-sm ml-6 mb-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm mb-1">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                  code: (props: {
                    inline?: boolean;
                    children?: React.ReactNode;
                  }) => {
                    const { inline, children } = props;
                    if (inline) {
                      return (
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative">
                        <code className="block bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto text-sm text-white">
                          {children}
                        </code>
                      </div>
                    );
                  },
                  // Add other markdown components as needed
                }}
              >
                {children}
              </ReactMarkdown>
    </div>
  );
};

export default Markdown;