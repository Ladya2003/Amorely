import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getAuthAlertSx, getAuthGoogleButtonSx } from './authPageStyles';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_button?: boolean;
            use_fedcm_for_prompt?: boolean;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let gisScriptPromise: Promise<void> | null = null;
let gisInitializedClientId: string | null = null;
const credentialListeners = new Set<(idToken: string) => void>();

/** Official multicolor Google "G" mark (branding guidelines). */
const GoogleMark: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
    aria-hidden
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </Box>
);

const loadGisScript = (): Promise<void> => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gisScriptPromise) {
    return gisScriptPromise;
  }
  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS load failed'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
};

const ensureGisInitialized = (clientId: string, onError: (message: string) => void): void => {
  if (!window.google?.accounts?.id) {
    return;
  }
  if (gisInitializedClientId === clientId) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        credentialListeners.forEach((listener) => listener(response.credential as string));
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_button: true,
    use_fedcm_for_prompt: true,
    error_callback: (error) => {
      console.warn('[Google Sign-In]', error);
      onError(error?.message || 'Google Sign-In error');
    },
  });
  gisInitializedClientId = clientId;
};

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/**
 * Amorely-styled Google button: visual shell matches auth UI, while a transparent
 * official GIS button sits on top so the real user gesture reaches Google (FedCM).
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  disabled = false,
  text = 'continue_with',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  callbackRef.current = onCredential;

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const listener = (idToken: string) => {
      void callbackRef.current(idToken);
    };
    credentialListeners.add(listener);

    const mount = async () => {
      try {
        await loadGisScript();
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) {
          return;
        }

        ensureGisInitialized(clientId, (message) => {
          if (!cancelled) {
            setLoadError(message || t('auth.google.loadFailed'));
          }
        });

        const render = () => {
          if (cancelled || !hostRef.current || !window.google?.accounts?.id) {
            return;
          }
          const width = Math.max(
            240,
            Math.min(shellRef.current?.offsetWidth || hostRef.current.offsetWidth || 320, 480)
          );
          hostRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(hostRef.current, {
            theme: 'outline',
            size: 'large',
            width,
            text,
            shape: 'rectangular',
            logo_alignment: 'left',
          });
          setReady(true);
          setLoadError(null);
        };

        render();

        if (typeof ResizeObserver !== 'undefined' && shellRef.current) {
          // Debounce re-renders — GIS initialize/render is expensive and ResizeObserver can spam.
          let frame = 0;
          resizeObserver = new ResizeObserver(() => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(render);
          });
          resizeObserver.observe(shellRef.current);
        }
      } catch {
        if (!cancelled) {
          setLoadError(t('auth.google.loadFailed'));
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
      credentialListeners.delete(listener);
      resizeObserver?.disconnect();
    };
  }, [clientId, text, t]);

  if (!clientId) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', opacity: disabled ? 0.55 : 1 }}>
      {loadError && (
        <Alert severity="warning" sx={getAuthAlertSx(theme)} onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}

      <Box
        ref={shellRef}
        sx={{
          ...getAuthGoogleButtonSx(theme),
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.25,
          cursor: disabled ? 'default' : 'pointer',
          overflow: 'hidden',
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {!ready && (
          <CircularProgress size={18} color="inherit" sx={{ position: 'absolute', opacity: 0.7 }} />
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <GoogleMark />
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              color: 'inherit',
            }}
          >
            {t('auth.google.continue')}
          </Typography>
        </Box>

        {/* Real GIS control — transparent overlay so the click is a genuine user gesture */}
        <Box
          ref={hostRef}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.001,
            overflow: 'hidden',
            zIndex: 2,
            '& > div': {
              width: '100% !important',
              height: '100% !important',
            },
            '& iframe': {
              width: '100% !important',
              height: '100% !important',
              minHeight: '100% !important',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default GoogleSignInButton;
