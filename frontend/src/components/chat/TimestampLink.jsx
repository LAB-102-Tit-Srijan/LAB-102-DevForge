import { Clock } from 'lucide-react';

const TimestampLink = ({ timestamp, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-hover text-xs font-medium hover:bg-primary/20 transition-all duration-200 hover:scale-105"
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
