import React, { useEffect, useRef } from 'react';
import { TURNSTILE_URL, type TurnstileProps } from '../config/turnstile';
import { useTheme } from '../theme';

/** Cloudflare "are you human" check. Remount (change `key`) to get a fresh single-use token. */
export function Turnstile({ onToken }: TurnstileProps) {
  const { mode } = useTheme();
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const token = event.data?.turnstileToken;
      if (typeof token === 'string') onToken(token);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onToken]);

  return (
    <iframe
      ref={frame}
      src={`${TURNSTILE_URL}?theme=${mode}`}
      title="Cloudflare Turnstile"
      style={{ border: 0, width: '100%', height: 65 }}
    />
  );
}
