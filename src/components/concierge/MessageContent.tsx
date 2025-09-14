import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
}

export const MessageContent = ({ content }: MessageContentProps) => (
  <div className="prose prose-sm max-w-none text-foreground">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  </div>
);