import { Clock } from 'lucide-react';

const TimestampLink = ({ timestamp, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="timestamp-chip"
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
