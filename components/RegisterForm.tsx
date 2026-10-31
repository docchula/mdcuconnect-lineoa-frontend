'use client';

import { useState } from 'react';
import liff from '@line/liff';
import { Loader2, AlertCircle, X, Mail } from 'lucide-react';
import { useLiff } from '@/hooks/useLiff';
import { validateRegistrationForm, ValidationErrors } from '@/lib/validation';

export default function RegisterForm() {
  const { isLiffLoading, liffError } = useLiff();

  const [studentId, setStudentId] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    studentId: string;
    email: string;
  } | null>(null);

  const handleCloseWindow = () => {
    try {
      if (typeof window !== 'undefined') {
        if (liff.isInClient()) {
          liff.closeWindow();
        } else {
          window.close();
        }
      }
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  };

  const handleEmailChange = (val: string) => {
    // Automatically strip @docchula.com or anything after @ if pasted
    const clean = val.replace(/@.*$/, '').trim();
    setEmailPrefix(clean);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const cleanPrefix = emailPrefix.trim().replace(/@.*$/, '');
    const fullEmail = cleanPrefix ? `${cleanPrefix}@docchula.com` : '';

    // 1. Client-side Form Validation
    const validation = validateRegistrationForm(studentId, fullEmail);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    // 2. Obtain LIFF Access Token
    let accessToken: string | null = null;
    try {
      accessToken = liff.getAccessToken();
    } catch (err) {
      console.warn('Could not read access token from LIFF:', err);
    }

    if (!accessToken) {
      if (!liff.isLoggedIn()) {
        try {
          liff.login();
          return;
        } catch (loginErr) {
          console.error('LIFF login failed:', loginErr);
        }
      }

      setApiError(
        'Unable to retrieve LINE access token. Please ensure you are logged into LINE.'
      );
      return;
    }

    // 3. Submit Registration Data to Backend API
    setIsLoading(true);

    try {
      const backendUrl = (
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      ).replace(/\/$/, '');

      const res = await fetch(`${backendUrl}/api/profile/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          studentId: studentId.trim(),
          email: fullEmail.trim(),
        }),
      });

      if (res.status === 200 || res.status === 201) {
        setSubmittedData({
          studentId: studentId.trim(),
          email: fullEmail.trim(),
        });
        setIsSuccess(true);
      } else {
        // Error handling (400 / 500)
        let errorDetail = 'Registration failed. Please try again.';
        try {
          const resData = await res.json();
          if (resData && typeof resData.error === 'string') {
            errorDetail = resData.error;
          } else if (resData && typeof resData.message === 'string') {
            errorDetail = resData.message;
          }
        } catch {
          errorDetail = `Server error (${res.status}). Please try again.`;
        }

        setApiError(errorDetail);
      }
    } catch (err: unknown) {
      console.error('Registration API error:', err);
      const networkMsg =
        err instanceof Error ? err.message : 'Network error. Please try again.';
      setApiError(networkMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen (Centered envelope icon, heading below icon, description, minimal)
  if (isSuccess) {
    const displayEmail =
      submittedData?.email ||
      (emailPrefix ? `${emailPrefix}@docchula.com` : 'อีเมลของคุณ');

    return (
      <div className="bg-zinc-100 rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        <div className="bg-white p-3.5 flex justify-end border-b border-zinc-100">
          <button
            type="button"
            onClick={handleCloseWindow}
            className="text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Centered Envelope Icon */}
          <div className="lex items-center justify-center mb-5 text-black">
            <Mail className="w-20 h-20 stroke-[1.5]" />
          </div>

          {/* Heading below icon */}
          <h2 className="text-xl font-bold text-black tracking-tight mb-3">
            ส่งอีเมลเรียบร้อยแล้ว
          </h2>

          {/* Description below heading */}
          <div className="text-zinc-600 text-xs leading-relaxed space-y-1 mb-4 max-w-[320px] text-left">
            <p>
              ขณะนี้ได้ส่งลิงก์ยืนยันตัวตนไปยังอีเมล{' '}
              <span className="font-semibold text-black break-all">
                {displayEmail}
              </span>
            </p>
            <p>
              กรุณาตรวจสอบกล่องข้อความ หรือกล่องข้อความขยะ (Spam/Junk) เพื่อทำการยืนยันตัวตน
            </p>
            <p className="mt-4">
              หากพบปัญหาการยืนยันตัวตน กรุณาติดต่อ: <br></br> <a href="mailto:itdivision@docchula.com">itdivision@docchula.com</a>
            </p>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => liff.closeWindow()}
            className="min-w-[140px] border border-black rounded-lg py-1 px-4 text-black text-md hover:shadow-sm cursor-pointer transition-all mb-2"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  // Registration Form (Original Design with fixed @docchula.com)
  return (
    <div className="bg-zinc-100 rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden">
      <div className="bg-white p-3.5 flex justify-end border-b border-zinc-100">
        <button
          type="button"
          onClick={handleCloseWindow}
          className="text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8 flex flex-col">
        <h1 className="text-4xl text-black tracking-tight leading-tight mb-8 font-gunter">
          MDCU
          <br />
          <span className="tracking-tighter">CONNECT</span>
        </h1>

        {/* LIFF ID notice in local dev if unconfigured */}
        {liffError && (
          <div
            role="alert"
            className="w-full mb-5 text-amber-800 text-xs flex items-start gap-2 text-left"
          >
            <div>
              <p>{liffError}</p>
            </div>
          </div>
        )}

        {/* Backend API Error Banner */}
        {apiError && (
          <div
            role="alert"
            className="w-full mb-5 text-red-700 text-xs flex items-start gap-2 text-left"
          >
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          {/* Student ID */}
          <div className="w-full mb-5">
            <label
              htmlFor="studentId"
              className="block text-left text-sm font-semibold text-black mb-1.5"
            >
              รหัสนิสิต 10 หลัก
            </label>
            <input
              id="studentId"
              type="text"
              maxLength={10}
              value={studentId}
              disabled={isLoading}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                setStudentId(cleaned);
                if (fieldErrors.studentId) {
                  setFieldErrors((prev) => ({ ...prev, studentId: undefined }));
                }
                if (apiError) setApiError(null);
              }}
              className={`w-full border rounded-lg p-2.5 text-black text-sm outline-none bg-white transition-colors ${fieldErrors.studentId
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-zinc-300 focus:ring-1 focus:ring-black focus:border-black'
                }`}
            />
            {fieldErrors.studentId && (
              <p className="text-red-600 text-xs mt-1.5 text-left font-medium">
                {fieldErrors.studentId}
              </p>
            )}
          </div>

          {/* Email with fixed @docchula.com */}
          <div className="w-full mb-8">
            <label
              htmlFor="email"
              className="block text-left text-sm font-semibold text-black mb-1.5"
            >
              ที่อยู่อีเมล (@docchula.com)
            </label>
            <div className="relative w-full">
              <input
                id="email"
                type="text"
                value={emailPrefix}
                disabled={isLoading}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full border rounded-lg p-2.5 pr-[110px] text-black text-sm outline-none bg-white transition-colors ${fieldErrors.email
                  ? 'border-red-500 ring-1 ring-red-500'
                  : 'border-zinc-300 focus:ring-1 focus:ring-black focus:border-black'
                  }`}
              />
              <span className="absolute inset-y-0 right-0 flex items-center px-3 text-black font-medium text-sm pointer-events-none select-none">
                @docchula.com
              </span>
            </div>
            {fieldErrors.email && (
              <p className="text-red-600 text-xs mt-1.5 text-left font-medium">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLiffLoading}
            className={`min-w-[140px] border border-black rounded-lg py-1 px-4 text-black text-md hover:shadow-sm cursor-pointer transition-all mb-3 flex items-center justify-center gap-2 ${isLoading || isLiffLoading
              ? 'opacity-60 cursor-not-allowed bg-zinc-200'
              : 'hover:bg-black hover:text-white bg-transparent'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 text-current" />
                <span>กำลังบันทึก...</span>
              </>
            ) : isLiffLoading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 text-current" />
                <span>CONNECTING...</span>
              </>
            ) : (
              'REGISTER'
            )}
          </button>
        </form>

        <div className="text-center text-zinc-500 space-y-0.5 text-xs">
          <p>เพื่อยืนยันตัวตนก่อนเริ่มต้นใช้งาน</p>
          <p>ระบบจะส่งข้อความไปยังอีเมลที่ท่านลงทะเบียน</p>
        </div>
      </div>
    </div>
  );
}
