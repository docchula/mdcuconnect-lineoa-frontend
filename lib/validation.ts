export const ALLOWED_EMAIL_DOMAINS = ['@docchula.com'] as const;

export type AllowedEmailDomain = (typeof ALLOWED_EMAIL_DOMAINS)[number];

export interface ValidationErrors {
  studentId?: string;
  email?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export function validateRegistrationForm(
  studentId: string,
  email: string
): ValidationResult {
  const errors: ValidationErrors = {};
  const trimmedStudentId = studentId.trim();
  const trimmedEmail = email.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();

  // 1. Student ID validation
  if (!trimmedStudentId) {
    errors.studentId = 'กรุณากรอกรหัสนิสิต';
  } else if (!/^\d{10}$/.test(trimmedStudentId)) {
    errors.studentId = 'กรุณากรอกรหัสนิสิตให้ครบ 10 หลัก';
  }

  // 2. Email validation (strictly @docchula.com)
  if (!trimmedEmail) {
    errors.email = 'กรุณากรอกที่อยู่อีเมล (@docchula.com)';
  } else if (!normalizedEmail.endsWith('@docchula.com')) {
    errors.email = 'อีเมลต้องลงท้าย @docchula.com เท่านั้น';
  } else {
    const atIndex = normalizedEmail.indexOf('@');
    const emailPrefix = atIndex > 0 ? normalizedEmail.substring(0, atIndex) : '';

    if (!emailPrefix) {
      errors.email = 'กรุณากรอกชื่อผู้ใช้อีเมลก่อน @docchula.com';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(emailPrefix)) {
      errors.email = 'ชื่อผู้ใช้อีเมลไม่ถูกต้อง';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
