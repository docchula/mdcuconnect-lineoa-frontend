import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateRegistrationForm, ALLOWED_EMAIL_DOMAINS } from '../lib/validation.ts';

describe('validateRegistrationForm (docchula.com only)', () => {
  test('ALLOWED_EMAIL_DOMAINS strictly contains @docchula.com', () => {
    assert.deepStrictEqual(ALLOWED_EMAIL_DOMAINS, ['@docchula.com']);
  });

  test('validates valid studentId and @docchula.com email', () => {
    const result = validateRegistrationForm('6731194430', 'somchai@docchula.com');
    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.errors, {});
  });

  test('validates prefix with dots, underscores, and hyphens', () => {
    const result = validateRegistrationForm('6731194430', 'first.last_name-1@docchula.com');
    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.errors, {});
  });

  test('fails when email is not from @docchula.com domain', () => {
    const gmail = validateRegistrationForm('6731194430', 'user@gmail.com');
    assert.strictEqual(gmail.isValid, false);
    assert.strictEqual(gmail.errors.email, 'อีเมลต้องลงท้าย @docchula.com เท่านั้น');

    const hotmail = validateRegistrationForm('6731194430', 'user@hotmail.com');
    assert.strictEqual(hotmail.isValid, false);
    assert.strictEqual(hotmail.errors.email, 'อีเมลต้องลงท้าย @docchula.com เท่านั้น');

    const other = validateRegistrationForm('6731194430', 'user@otherdomain.com');
    assert.strictEqual(other.isValid, false);
    assert.strictEqual(other.errors.email, 'อีเมลต้องลงท้าย @docchula.com เท่านั้น');
  });

  test('fails when email prefix is empty', () => {
    const emptyPrefix = validateRegistrationForm('6731194430', '@docchula.com');
    assert.strictEqual(emptyPrefix.isValid, false);
    assert.strictEqual(emptyPrefix.errors.email, 'กรุณากรอกชื่อผู้ใช้อีเมลก่อน @docchula.com');
  });

  test('fails when email prefix contains invalid characters', () => {
    const invalidChar = validateRegistrationForm('6731194430', 'user name@docchula.com');
    assert.strictEqual(invalidChar.isValid, false);
    assert.strictEqual(invalidChar.errors.email, 'ชื่อผู้ใช้อีเมลไม่ถูกต้อง');
  });

  test('fails when studentId is not 10 digits', () => {
    const shortId = validateRegistrationForm('123456789', 'doctor@docchula.com');
    assert.strictEqual(shortId.isValid, false);
    assert.strictEqual(shortId.errors.studentId, 'กรุณากรอกรหัสนิสิตให้ครบ 10 หลัก');

    const longId = validateRegistrationForm('12345678901', 'doctor@docchula.com');
    assert.strictEqual(longId.isValid, false);
    assert.strictEqual(longId.errors.studentId, 'กรุณากรอกรหัสนิสิตให้ครบ 10 หลัก');

    const nonDigit = validateRegistrationForm('12345abcde', 'doctor@docchula.com');
    assert.strictEqual(nonDigit.isValid, false);
    assert.strictEqual(nonDigit.errors.studentId, 'กรุณากรอกรหัสนิสิตให้ครบ 10 หลัก');
  });

  test('fails when studentId is empty', () => {
    const emptyId = validateRegistrationForm('', 'doctor@docchula.com');
    assert.strictEqual(emptyId.isValid, false);
    assert.strictEqual(emptyId.errors.studentId, 'กรุณากรอกรหัสนิสิต');
  });

  test('handles case-insensitivity and whitespace properly', () => {
    const result = validateRegistrationForm(' 6731194430 ', ' USERNAME@DOCCHULA.COM ');
    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.errors, {});
  });
});
