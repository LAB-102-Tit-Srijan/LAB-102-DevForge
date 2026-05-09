const prompts = [
  'What is useEffect?',
  'Summarize this lecture.',
  'Quiz me on this video.',
  'Explain this like I\'m a beginner.',
];

const SuggestedPrompts = ({ onSelect, compact = false, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {prompts.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          className={`text-left rounded-xl border border-border-subtle bg-surface-elevated hover:bg-surface-overlay hover:border-primary/30 transition-all duration-200 text-text-secondary hover:text-text-primary ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
