const prompts = [
  'Summarize this lecture.',
  'Quiz me on this video.',
  'Explain the last 5 minutes.',
];

const SuggestedPrompts = ({ onSelect, compact = false, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {prompts.map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          className={`suggested-prompt ${compact ? 'py-1 px-3 text-[11px]' : ''}`}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
