export const TypingIndicator = () => (
  <div className="flex gap-1">
    {[0, 1, 2].map((i) => (
      <div 
        key={i}
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);