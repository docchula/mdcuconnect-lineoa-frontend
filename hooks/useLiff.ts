'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import liff from '@line/liff';

export interface UseLiffReturn {
  isLiffReady: boolean;
  isLiffLoading: boolean;
  liffError: string | null;
  isLoggedIn: boolean;
  isInClient: boolean;
  getAccessToken: () => string | null;
  closeWindow: () => void;
  login: () => void;
}

/**
 * Custom hook to initialize the LINE LIFF SDK on page load,
 * prompt login if the user is not authenticated, and provide
 * helpers for token retrieval and window management.
 */
export function useLiff(): UseLiffReturn {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (!liffId) {
        console.warn(
          'NEXT_PUBLIC_LIFF_ID is not configured. Please set NEXT_PUBLIC_LIFF_ID in .env.local'
        );
        setLiffError('NEXT_PUBLIC_LIFF_ID is not configured in .env.local');
        setIsLiffLoading(false);
        return;
      }

      try {
        await liff.init({ liffId });
        setIsInClient(liff.isInClient());
        const loggedIn = liff.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (!loggedIn) {
          liff.login();
          return;
        }

        setIsLiffReady(true);
      } catch (err: unknown) {
        console.error('LIFF initialization failed:', err);
        const message =
          err instanceof Error ? err.message : 'LIFF initialization failed';
        setLiffError(message);
      } finally {
        setIsLiffLoading(false);
      }
    };

    void initializeLiff();
  }, []);

  const getAccessToken = useCallback(() => {
    try {
      return liff.getAccessToken();
    } catch (err) {
      console.error('Failed to get access token from LIFF:', err);
      return null;
    }
  }, []);

  const closeWindow = useCallback(() => {
    try {
      if (liff.isInClient()) {
        liff.closeWindow();
      } else {
        window.close();
      }
    } catch (err) {
      console.error('Failed to close LIFF window:', err);
    }
  }, []);

  const login = useCallback(() => {
    try {
      liff.login();
    } catch (err) {
      console.error('Failed to initiate LIFF login:', err);
    }
  }, []);

  return {
    isLiffReady,
    isLiffLoading,
    liffError,
    isLoggedIn,
    isInClient,
    getAccessToken,
    closeWindow,
    login,
  };
}
