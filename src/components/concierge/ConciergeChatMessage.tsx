import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AddressCopyButton } from "./AddressCopyButton";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: Array<{ type: string; image: string }>;
  structuredData?: any;
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
  
  // Função para extrair endereços do texto
  const extractAddresses = (text: string): string[] => {
    const addressSection = text.match(/\*\*📍\s*Endereços:\*\*\s*([\s\S]*?)(?=\n\n|\n\*\*|\n---|$)/);
    if (!addressSection) return [];
    
    const addressLines = addressSection[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('*') && !line.startsWith('#'));
    
    return addressLines;
  };
  
  // Função para renderizar texto com endereços copyable
  const renderTextWithAddresses = (content: string) => {
    const addresses = extractAddresses(content);
    
    if (addresses.length === 0) {
      return (
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
          {content}
        </ReactMarkdown>
      );
    }
    
    // Se há endereços, renderiza com botões de copiar
    const textBeforeAddresses = content.split(/\*\*📍\s*Endereços:\*\*/)[0];
    
    return (
      <div>
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
          {textBeforeAddresses}
        </ReactMarkdown>
        
        <div className="mt-4 border-t border-muted pt-3">
          <h4 className="text-sm font-semibold mb-3 flex items-center">
            📍 Endereços:
          </h4>
          <div className="space-y-2">
            {addresses.map((address, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-muted/30 rounded-lg">
                <span className="text-sm leading-relaxed flex-1">{address}</span>
                <AddressCopyButton address={address} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      key={index}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } px-4 mb-4`}
    >
      <div
        className={`w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : message.role === "assistant" ? (
          <div>
            {renderTextWithAddresses(message.content)}
            
            {/* Imagens geradas pela AI */}
            {message.images && message.images.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-muted-foreground font-medium">Imagens sugeridas:</div>
                <div className="grid grid-cols-1 gap-3">
                  {message.images.map((imageData, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={imageData.image}
                        alt={`Sugestão ${imageData.type === 'restaurant' ? 'do restaurante' : 'da atração'}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {imageData.type === 'restaurant' ? 'Restaurante' : 'Atração'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  );
});

ConciergeChatMessage.displayName = "ConciergeChatMessage";

export { ConciergeChatMessage };