import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConciergeChatMessageProps {
  message: Message;
  index: number;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1">
    <span className="text-muted-foreground text-sm">IA está digitando</span>
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
);

const ConciergeChatMessage = memo(({ message, index }: ConciergeChatMessageProps) => {
  const isTyping = message.role === "assistant" && message.content === "...";

  return (
    <div
      key={index}
      className={`flex items-start gap-3 sm:gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      } px-4 mb-6`}
    >
      {message.role !== "user" && (
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted text-foreground/80 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={`w-full max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-sm ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : message.role === "assistant" ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                />
              ),
              ul: (props) => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
              li: (props) => <li className="my-1 leading-relaxed" {...props} />,
              h1: (props) => <h1 className="text-lg font-bold mb-3 mt-2" {...props} />,
              h2: (props) => <h2 className="text-base font-semibold mb-3 mt-2" {...props} />,
              h3: (props) => <h3 className="text-sm font-semibold mb-2 mt-2" {...props} />,
              p: (props) => <p className="leading-relaxed mb-3 last:mb-0" {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              code: (props) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm" {...props} />,
              blockquote: (props) => <blockquote className="border-l-4 border-muted-foreground/20 pl-4 my-3 italic" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>
      {message.role === "user" && (
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium">Eu</span>
        </div>
      )}
    </div>
  );
});

ConciergeChatMessage.displayName = "ConciergeChatMessage";

export { ConciergeChatMessage };