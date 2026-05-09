import { describe, test, expect } from '@jest/globals';
import { chunkTranscript } from '../src/services/transcript.service.js';

describe('Transcript Chunking', () => {
  test('should create chunks from transcript segments', () => {
    const segments = [];
    for (let i = 0; i < 100; i++) {
      segments.push({
        text: `This is segment number ${i} with some words to fill the content properly`,
        offset: i * 5000,
        duration: 5000,
      });
    }

    const chunks = chunkTranscript(segments, 50);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('chunkId');
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('startSeconds');
    expect(chunks[0]).toHaveProperty('endSeconds');
    expect(chunks[0]).toHaveProperty('startTimestamp');
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
      { text: 'First segment', offset: 0, duration: 3000 },
      { text: 'Second segment', offset: 3000, duration: 3000 },
      { text: 'Third segment', offset: 6000, duration: 3000 },
    ];
    const chunks = chunkTranscript(segments, 5);
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].startSeconds).toBeGreaterThanOrEqual(chunks[i - 1].startSeconds);
    }
  });

  test('should format timestamps correctly', () => {
    const segments = [
      { text: 'Content at 2 minutes 30 seconds into the video with enough words to make a chunk', offset: 150000, duration: 5000 },
    ];
    const chunks = chunkTranscript(segments, 5);
    expect(chunks[0].startTimestamp).toBe('2:30');
  });
});

describe('Cache Key Generation', () => {
  test('should import cache functions', async () => {
    // This test validates module structure
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
