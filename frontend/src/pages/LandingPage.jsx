import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Sparkles, MessageSquare, Clock, BookOpen,
  Zap, ArrowRight, Play, FileText, HelpCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const features = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Contextual Q&A',
    description: 'Ask questions about any lecture and get AI-powered answers grounded in actual content.',
    color: 'from-primary to-indigo-400',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Jump-to-Moment',
    description: 'Click timestamps to jump to the exact moment a concept was explained.',
    color: 'from-accent to-cyan-300',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Smart Summaries',
    description: 'Generate short, normal, or detailed study notes from any lecture.',
    color: 'from-success to-emerald-300',
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    title: 'Quiz Generation',
    description: 'Test your understanding with AI-generated MCQs and open-ended questions.',
    color: 'from-warning to-amber-300',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Streaming Responses',
    description: 'See answers appear in real-time with smooth token-by-token streaming.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Session Memory',
    description: 'Continue conversations naturally with full context of your chat history.',
    color: 'from-rose-500 to-orange-400',
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-hover text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Learning Companion
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Turn every coding lecture into an{' '}
              <span className="gradient-text">interactive AI tutor</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              SheriSense transforms video lectures into intelligent study sessions.
              Ask questions, get grounded answers, jump to exact timestamps, generate quizzes,
              and create smart summaries — all powered by AI.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/teacher">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Play className="w-5 h-5" />
                  Get Started — Process a Video
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 max-w-5xl mx-auto"
          >
            <div className="glass rounded-2xl p-1 shadow-2xl shadow-primary/10">
              <div className="bg-surface rounded-xl p-6 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-text-secondary text-lg">
                    Process a YouTube lecture to see the magic ✨
                  </p>
                  <Link to="/teacher">
                    <Button variant="secondary" size="sm">
                      Try it now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────── */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="gradient-text">master lectures</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Powered by advanced RAG technology and Groq's ultra-fast inference.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card glass hover className="h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card glass className="py-16 px-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to transform your lectures?
              </h2>
              <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
                Start by processing your first video. It takes less than 60 seconds.
              </p>
              <Link to="/teacher">
                <Button size="lg" className="gap-2">
                  <Upload className="w-5 h-5" />
                  Upload a Video
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold gradient-text">SheriSense</span>
          </div>
          <p className="text-text-muted text-sm">
            Built with ❤️ for Sheriyans Coding School
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
