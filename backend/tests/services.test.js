import { describe, test, expect } from '@jest/globals';
import { chunkTranscript } from '../src/services/chunking.service.js';

describe('Transcript Chunking (Whisper segments)', () => {
  test('should create chunks from Whisper segments', () => {
    const segments = [];
    for (let i = 0; i < 50; i++) {
      segments.push({
        text: `This is segment number ${i} with some words to fill the content properly and add more context`,
        start: i * 10,
        end: (i + 1) * 10,
      });
    }

    const chunks = chunkTranscript(segments, 50);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('chunkId');
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('startSeconds');
    expect(chunks[0]).toHaveProperty('endSeconds');
    expect(chunks[0]).toHaveProperty('startTimestamp');
    expect(chunks[0]).toHaveProperty('endTimestamp');
    expect(chunks[0]).toHaveProperty('tokenCount');
  });

  test('should handle empty segments', () => {
    const chunks = chunkTranscript([]);
    expect(chunks).toEqual([]);
  });

  test('should handle null input', () => {
    const chunks = chunkTranscript(null);
    expect(chunks).toEqual([]);
  });

  test('should preserve timestamp ordering', () => {
    const segments = [
      { text: 'First segment with some content', start: 0, end: 5 },
      { text: 'Second segment with more content', start: 5, end: 10 },
      { text: 'Third segment with even more', start: 10, end: 15 },
    ];
    const chunks = chunkTranscript(segments, 5);
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].startSeconds).toBeGreaterThanOrEqual(chunks[i - 1].startSeconds);
    }
  });

  test('should format timestamps correctly (mm:ss)', () => {
    const segments = [
      { text: 'Content at 2 minutes 30 seconds into the video with enough words to fill', start: 150, end: 155 },
    ];
    const chunks = chunkTranscript(segments, 5);
    expect(chunks[0].startTimestamp).toBe('2:30');
    expect(chunks[0].endTimestamp).toBe('2:35');
  });

  test('should include endTimestamp in each chunk', () => {
    const segments = [
      { text: 'Start of lecture', start: 0, end: 30 },
      { text: 'Middle of lecture', start: 30, end: 60 },
      { text: 'End of lecture', start: 60, end: 90 },
    ];
    const chunks = chunkTranscript(segments, 5);
    chunks.forEach((chunk) => {
      expect(chunk.endTimestamp).toBeDefined();
      expect(chunk.endSeconds).toBeGreaterThanOrEqual(chunk.startSeconds);
    });
  });

  test('should handle Whisper segment format (start/end as floats)', () => {
    const segments = [
      { text: 'Today we will learn about React hooks.', start: 0.0, end: 3.5 },
      { text: 'useEffect runs after every render.', start: 3.5, end: 7.2 },
      { text: 'It accepts a callback and a dependency array.', start: 7.2, end: 12.8 },
    ];
    const chunks = chunkTranscript(segments, 5);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].startSeconds).toBe(0);
    expect(chunks[0].text).toContain('React hooks');
  });
});

describe('Cache Key Generation', () => {
  test('should import cache functions', async () => {
    const { cacheKey } = await import('../src/services/cache.service.js');
    expect(typeof cacheKey).toBe('function');
  });
});

describe('Prompt Formatting', () => {
  test('should format QA prompt with context', async () => {
    const { qaPrompt } = await import('../src/prompts/qa.prompt.js');
    const chunks = [{ startTimestamp: '1:30', text: 'useEffect is a React hook' }];
    const prompt = qaPrompt(chunks);
    expect(prompt).toContain('useEffect is a React hook');
    expect(prompt).toContain('1:30');
    expect(prompt).toContain('STRICT RULES');
  });

  test('should format summary prompt for each mode', async () => {
    const { summaryPrompt } = await import('../src/prompts/summary.prompt.js');
    expect(summaryPrompt('short')).toContain('SHORT');
    expect(summaryPrompt('detailed')).toContain('DETAILED');
    expect(summaryPrompt('last5')).toContain('last 5 minutes');
  });

  test('should format quiz prompt with topic', async () => {
    const { quizPrompt } = await import('../src/prompts/quiz.prompt.js');
    const prompt = quizPrompt({ topic: 'React Hooks', type: 'topic' });
    expect(prompt).toContain('React Hooks');
    expect(prompt).toContain('JSON');
  });
});
