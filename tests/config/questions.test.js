const questions = require('../../src/config/questions');

describe('config/questions', () => {
  test('should export question sets as objects', () => {
    expect(typeof questions).toBe('object');
    expect(Array.isArray(questions.add)).toBe(true);
    expect(Array.isArray(questions.update)).toBe(true);
    expect(Array.isArray(questions.remove)).toBe(true);
  });
});