import Groq from 'groq-sdk';
import logger from '../utils/logger.js';
import { qaPrompt } from '../prompts/qa.prompt.js';
import { summaryPrompt } from '../prompts/summary.prompt.js';
import { quizPrompt } from '../prompts/quiz.prompt.js';

const MODEL = 'llama-3.3-70b-versatile';

let groq = null;
const getGroq = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

/**
 * Generate a grounded answer using RAG context.
 * Streams response tokens via callback.
 */
export async function generateAnswer(context, question, history = []) {
  const client = getGroq();
  const systemMessage = qaPrompt(context);
  const messages = [
    { role: 'system', content: systemMessage },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
    stream: true,
  });

  return stream;
}

/**
 * Generate a summary based on mode.
 */
export async function generateSummary(chunks, mode = 'normal') {
  const client = getGroq();
  const systemMessage = summaryPrompt(mode);
  const content = chunks.map((c) => `[${c.startTimestamp}] ${c.text}`).join('\n\n');

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Here is the lecture transcript:\n\n${content}` },
    ],
    temperature: 0.4,
    max_tokens: mode === 'detailed' ? 4096 : mode === 'normal' ? 2048 : 1024,
    stream: true,
  });

  return stream;
}

/**
 * Generate a quiz from chunks.
 */
export async function generateQuiz(chunks, options = {}) {
  const client = getGroq();
  const systemMessage = quizPrompt(options);
  const content = chunks.map((c) => `[${c.startTimestamp}] ${c.text}`).join('\n\n');

  let userMessage = `Generate a quiz based on this lecture content:\n\n${content}`;
  if (options.history?.length > 0) {
    const chatContext = options.history.map((m) => `${m.role}: ${m.content}`).join('\n');
    userMessage += `\n\nRecent chat discussion:\n${chatContext}`;
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.5,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    logger.error('Failed to parse quiz JSON');
    return { questions: [] };
  }
}
