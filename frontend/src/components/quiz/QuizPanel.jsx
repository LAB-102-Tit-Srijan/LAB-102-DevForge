import { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Trophy } from 'lucide-react';
import Button from '../ui/Button';
import { generateQuiz } from '../../lib/api';
import useChatStore from '../../store/chatStore';

const QuizPanel = ({ videoId }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const { getLastMessages } = useChatStore();

  const handleGenerate = async (type = 'video') => {
    setQuiz(null); setAnswers({}); setSubmitted(false); setLoading(true);
    try {
      const payload = { videoId, type, topic: topic || undefined };
      if (type === 'conversation') payload.history = getLastMessages(videoId, 10);
      const { data } = await generateQuiz(payload);
      setQuiz(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAnswer = (qIndex, answer) => { if (!submitted) setAnswers(prev => ({ ...prev, [qIndex]: answer })); };

  const handleSubmit = () => setSubmitted(true);

  const score = quiz ? quiz.questions.reduce((acc, q, i) => {
    if (q.type === 'mcq' && answers[i] === q.correctAnswer) return acc + 1;
    return acc;
  }, 0) : 0;

  return (
    <div className="flex flex-col h-full p-5 custom-scrollbar overflow-y-auto">
      {!quiz ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center mb-5">
            <HelpCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Test Your Knowledge</h3>
          <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-secondary)' }}>Generate a quiz based on the lecture content.</p>
          <div className="space-y-3 w-full max-w-xs">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="w-full px-5 py-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-300"
            />
            <Button onClick={() => handleGenerate('video')} loading={loading} className="w-full btn-primary">
              Quiz on Entire Video
            </Button>
            <Button onClick={() => handleGenerate('topic')} variant="secondary" loading={loading} className="w-full btn-secondary" disabled={!topic}>
              Quiz on Topic
            </Button>
            <Button onClick={() => handleGenerate('conversation')} variant="secondary" loading={loading} className="w-full btn-secondary">
              Quiz on Chat Discussion
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Score Card */}
          {submitted && (
            <div className="card p-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(22, 101, 52, 0.15)' }}>
                <Trophy className="w-7 h-7" style={{ color: '#4ADE80' }} />
              </div>
              <p className="quiz-score">{score} <span>/ {quiz.questions.filter(q => q.type === 'mcq').length}</span></p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>MCQ Score</p>
            </div>
          )}

          {/* Questions */}
          {quiz.questions.map((q, i) => (
            <div key={i} className="card p-5 space-y-3">
              <p className="quiz-question">Q{i + 1}. {q.question}</p>
              {q.type === 'mcq' ? (
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j);
                    const isSelected = answers[i] === letter;
                    const isCorrect = submitted && letter === q.correctAnswer;
                    const isWrong = submitted && isSelected && letter !== q.correctAnswer;
                    return (
                      <button
                        key={j}
                        onClick={() => handleAnswer(i, letter)}
                        className={`quiz-option ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                        style={isSelected && !submitted ? { borderColor: 'var(--accent)', background: 'var(--accent-muted)', color: 'var(--accent)' } : {}}
                      >
                        <span className="font-medium mr-2">{letter}.</span>{opt}
                        {isCorrect && <CheckCircle className="w-4 h-4 inline ml-2" />}
                        {isWrong && <XCircle className="w-4 h-4 inline ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  placeholder="Your answer..."
                  value={answers[i] || ''}
                  onChange={e => handleAnswer(i, e.target.value)}
                  className="w-full px-4 py-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] text-sm min-h-[80px] resize-none"
                  disabled={submitted}
                />
              )}
              {submitted && q.explanation && (
                <p className="text-xs rounded-[6px] p-3 leading-relaxed" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>{q.explanation}</p>
              )}
            </div>
          ))}

          {/* Actions */}
          {!submitted && <Button onClick={handleSubmit} className="w-full btn-primary">Submit Answers</Button>}
          {submitted && (
            <Button
              onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false); }}
              variant="secondary"
              className="w-full btn-secondary"
            >
              New Quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPanel;
