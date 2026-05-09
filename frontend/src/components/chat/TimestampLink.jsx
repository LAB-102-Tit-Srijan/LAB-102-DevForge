import { Clock } from 'lucide-react';

const TimestampLink = ({ timestamp, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral-muted border border-border-strong text-coral text-xs font-medium hover:bg-coral/20 transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label={`Jump to ${timestamp.startTimestamp || formatSeconds(timestamp.startSeconds)}`}
    >
      <Clock className="w-3 h-3" />
      {timestamp.startTimestamp || formatSeconds(timestamp.startSeconds)}
    </button>
  );
};

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default TimestampLink;
