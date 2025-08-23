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

const ConciergeChatMessage = memo(({ message, index }: ConciergeChatMessageProps) => {
  return (
    <div
      key={index}
      className={`flex items-start gap-2 sm:gap-3 ${
        message.role === "user" ? "justify-end" : "justify-start"
      } px-4`}
    >
      {message.role !== "user" && (
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted text-foreground/80 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      )}
      <div
        className={`w-full max-w-[85%] sm:max-w-[80%] lg:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.role === "assistant" ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                />
              ),
              ul: (props) => <ul className="list-disc pl-5 my-2" {...props} />,
              ol: (props) => <ol className="list-decimal pl-5 my-2" {...props} />,
              li: (props) => <li className="my-1" {...props} />,
              h1: (props) => <h1 className="text-lg font-bold mb-2" {...props} />,
              h2: (props) => <h2 className="text-base font-semibold mb-2" {...props} />,
              p: (props) => <p className="leading-relaxed mb-2" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>
      {message.role === "user" && (
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium">Eu</span>
        </div>
      )}
    </div>
  );
});

ConciergeChatMessage.displayName = "ConciergeChatMessage";

export { ConciergeChatMessage };