const questions = require('../../src/config/questions');

describe('config/questions', () => {
  test('should export question sets as objects', () => {
    expect(typeof questions).toBe('object');
    expect(Array.isArray(questions.init)).toBe(true);
    expect(Array.isArray(questions.changePassword)).toBe(true);
    expect(Array.isArray(questions.add)).toBe(true);
    expect(Array.isArray(questions.changePassword)).toBe(true);
  });

  test('should preserve passwords exactly and confirm the initial vault password', () => {
    const initialSecret = questions.init[0];
    const confirmation = questions.init[1];
    const accountPassword = questions.add.find(question => question.name === 'password');

    expect(initialSecret.filter).toBeUndefined();
    expect(accountPassword.filter).toBeUndefined();
    expect(confirmation.validate(' secret ', { secret: ' secret ' })).toBe(true);
    expect(confirmation.validate('different', { secret: ' secret ' })).toBe('Passwords do not match.');
    expect(questions.changePassword[1].validate(' new ', { newSecret: ' new ' })).toBe(true);
  });
});
