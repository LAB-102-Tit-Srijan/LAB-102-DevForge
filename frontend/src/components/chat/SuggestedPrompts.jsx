const prompts = [
  'What is this concept?',
  'Summarize this lecture.',
  'Quiz me on this video.',
  'Explain like I\'m a beginner.',
];

const SuggestedPrompts = ({ onSelect, compact = false, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {prompts.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          className={`text-left rounded-full border border-border-default hover:border-border-strong bg-bg-card hover:bg-bg-elevated transition-all duration-300 text-text-muted hover:text-coral cursor-pointer ${
            compact ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'
          }`}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
