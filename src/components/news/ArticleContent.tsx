'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export function ArticleContent({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none
      prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
      prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-zinc-300
      prose-a:text-black dark:prose-a:text-white prose-a:font-bold prose-a:underline
      prose-blockquote:border-l-4 prose-blockquote:border-black dark:prose-blockquote:border-zinc-400 prose-blockquote:pl-4 prose-blockquote:font-medium
      prose-img:border-2 prose-img:border-black dark:prose-img:border-zinc-600 prose-img:shadow-[4px_4px_0px_#000] prose-img:w-full prose-img:object-cover
      prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm
      prose-pre:bg-zinc-900 prose-pre:border-2 prose-pre:border-black prose-pre:p-4
      prose-ul:list-disc prose-ol:list-decimal
      prose-strong:font-black
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Видео по прямой ссылке (mp4, webm)
          a: ({ href, children, ...props }) => {
            if (href && /\.(mp4|webm|ogg)(\?.*)?$/i.test(href)) {
              return (
                <video controls className="w-full border-2 border-black dark:border-zinc-600 shadow-[4px_4px_0px_#000] my-4">
                  <source src={href} />
                </video>
              );
            }
            // YouTube embed
            const ytMatch = href?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (ytMatch) {
              return (
                <div className="relative w-full aspect-video border-2 border-black dark:border-zinc-600 shadow-[4px_4px_0px_#000] my-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
            return <a href={href} {...props}>{children}</a>;
          },
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? ''} className="w-full border-2 border-black dark:border-zinc-600 shadow-[4px_4px_0px_#000] my-4 object-cover" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
