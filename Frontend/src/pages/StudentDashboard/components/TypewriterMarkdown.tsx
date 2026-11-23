import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTypewriter } from '../../../hooks/useTypewriter';

export interface TypewriterMarkdownProps {
  content: string;
  isTyping?: boolean;
  isStudent?: boolean;
  onFinish?: () => void;
  onTick?: () => void;
}

/**
 * Cierra temporalmente bloques de código Markdown que hayan quedado abiertos
 * a mitad del tipeo progresivo (número impar de triple backticks).
 */
function closeOpenCodeFences(markdown: string): string {
  const matches = markdown.match(/```/g);
  if (matches && matches.length % 2 !== 0) {
    return `${markdown}\n\`\`\``;
  }
  return markdown;
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
  content,
  isTyping = false,
  isStudent = false,
  onFinish,
  onTick,
}) => {
  const { displayedText, isComplete, skip } = useTypewriter(content, {
    enabled: isTyping,
    onComplete: onFinish,
    onTick,
  });

  const safeMarkdown = useMemo(
    () => (isComplete ? content : closeOpenCodeFences(displayedText)),
    [content, displayedText, isComplete]
  );

  return (
    <div
      className="markdown-chat-container relative group/typewriter cursor-pointer select-text"
      onClick={() => {
        if (!isComplete) skip();
      }}
      title={!isComplete ? 'Click para mostrar todo el texto' : undefined}
    >
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-inherit" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2.5 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2.5 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          h3: ({ node, ...props }) => <h3 className="font-bold text-base mt-3 mb-1.5" {...props} />,
          h4: ({ node, ...props }) => <h4 className="font-semibold text-sm mt-2 mb-1" {...props} />,
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code
                className={`px-1.5 py-0.5 rounded-md font-mono text-[12.5px] ${
                  isStudent
                    ? 'bg-black/25 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-semibold'
                }`}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block p-3 rounded-xl font-mono text-[12.5px] my-2.5 overflow-x-auto border ${
                  isStudent
                    ? 'bg-black/25 border-white/10 text-white'
                    : 'bg-surface-900 text-surface-100 border-surface-800'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {safeMarkdown}
      </ReactMarkdown>

      {!isComplete && (
        <span
          className="inline-block w-1.5 h-3.5 ml-0.5 bg-brand-500 rounded-xs animate-pulse align-middle"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default TypewriterMarkdown;
