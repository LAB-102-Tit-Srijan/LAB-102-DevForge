import { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Trophy } from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
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
    <div className="flex flex-col h-full p-4">
      {!quiz ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <HelpCircle className="w-12 h-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold mb-2">Test Your Knowledge</h3>
          <p className="text-text-secondary text-sm mb-6">Generate a quiz based on the lecture content.</p>
          <div className="space-y-3 w-full max-w-xs">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <Button onClick={() => handleGenerate('video')} loading={loading} className="w-full">Quiz on Entire Video</Button>
            <Button onClick={() => handleGenerate('topic')} variant="secondary" loading={loading} className="w-full" disabled={!topic}>Quiz on Topic</Button>
            <Button onClick={() => handleGenerate('conversation')} variant="outline" loading={loading} className="w-full">Quiz on Chat Discussion</Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {submitted && (
            <Card glass className="text-center">
              <Trophy className="w-10 h-10 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{score} / {quiz.questions.filter(q => q.type === 'mcq').length}</p>
              <p className="text-text-secondary text-sm">MCQ Score</p>
            </Card>
          )}
          {quiz.questions.map((q, i) => (
            <Card key={i} glass className="space-y-3">
              <p className="font-medium text-sm">Q{i + 1}. {q.question}</p>
              {q.type === 'mcq' ? (
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j);
                    const isSelected = answers[i] === letter;
                    const isCorrect = submitted && letter === q.correctAnswer;
                    const isWrong = submitted && isSelected && letter !== q.correctAnswer;
                    return (
                      <button key={j} onClick={() => handleAnswer(i, letter)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${isCorrect ? 'bg-success/20 border-success/30 text-success' : isWrong ? 'bg-error/20 border-error/30 text-error' : isSelected ? 'bg-primary/20 border-primary/30 text-primary-hover' : 'bg-surface border-border-subtle text-text-secondary hover:border-primary/30'}`}>
                        <span className="font-medium mr-2">{letter}.</span>{opt}
                        {isCorrect && <CheckCircle className="w-4 h-4 inline ml-2" />}
                        {isWrong && <XCircle className="w-4 h-4 inline ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea placeholder="Your answer..." value={answers[i] || ''} onChange={e => handleAnswer(i, e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[80px] resize-none" disabled={submitted} />
              )}
              {submitted && q.explanation && <p className="text-xs text-text-muted bg-surface rounded-lg p-2">{q.explanation}</p>}
            </Card>
          ))}
          {!submitted && <Button onClick={handleSubmit} className="w-full">Submit Answers</Button>}
          {submitted && <Button onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false); }} variant="secondary" className="w-full">New Quiz</Button>}
        </div>
      )}
    </div>
  );
};

export default QuizPanel;
