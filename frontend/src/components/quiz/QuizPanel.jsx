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
    <div className="flex flex-col h-full p-5">
      {!quiz ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-[20px] bg-bg-card border border-border-default flex items-center justify-center mb-5">
            <HelpCircle className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Test Your Knowledge</h3>
          <p className="text-text-secondary text-sm mb-8 max-w-xs">Generate a quiz based on the lecture content.</p>
          <div className="space-y-3 w-full max-w-xs">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="w-full px-5 py-3 rounded-[16px] bg-bg-input border border-border-default text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-border-strong transition-all duration-300"
            />
            <Button onClick={() => handleGenerate('video')} loading={loading} className="w-full">
              Quiz on Entire Video
            </Button>
            <Button onClick={() => handleGenerate('topic')} variant="secondary" loading={loading} className="w-full" disabled={!topic}>
              Quiz on Topic
            </Button>
            <Button onClick={() => handleGenerate('conversation')} variant="outline" loading={loading} className="w-full">
              Quiz on Chat Discussion
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Score Card */}
          {submitted && (
            <div className="rounded-[24px] bg-bg-card border border-border-default p-6 text-center card-shadow">
              <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-7 h-7 text-warning" />
              </div>
              <p className="text-3xl font-bold text-text-primary">{score} / {quiz.questions.filter(q => q.type === 'mcq').length}</p>
              <p className="text-text-secondary text-sm mt-1">MCQ Score</p>
            </div>
          )}

          {/* Questions */}
          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-[20px] bg-bg-card border border-border-default p-5 space-y-3 card-shadow">
              <p className="font-medium text-sm text-text-primary">Q{i + 1}. {q.question}</p>
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
                        className={`w-full text-left px-4 py-3 rounded-[14px] text-sm transition-all duration-300 border cursor-pointer ${
                          isCorrect ? 'bg-success/15 border-success/30 text-success'
                          : isWrong ? 'bg-error/15 border-error/30 text-error'
                          : isSelected ? 'bg-coral-muted border-border-strong text-coral'
                          : 'bg-bg-secondary border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary'
                        }`}
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
                  className="w-full px-4 py-3 rounded-[14px] bg-bg-secondary border border-border-default text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm min-h-[80px] resize-none"
                  disabled={submitted}
                />
              )}
              {submitted && q.explanation && (
                <p className="text-xs text-text-muted bg-bg-secondary rounded-[12px] p-3 leading-relaxed">{q.explanation}</p>
              )}
            </div>
          ))}

          {/* Actions */}
          {!submitted && <Button onClick={handleSubmit} className="w-full">Submit Answers</Button>}
          {submitted && (
            <Button
              onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false); }}
              variant="secondary"
              className="w-full"
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
