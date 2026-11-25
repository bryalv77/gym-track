import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Rejects the request unless its JSON body carries a valid, unused Turnstile token. */
export const requireHuman = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.TURNSTILE_SECRET_KEY) return c.json({ error: 'Server misconfigured' }, 500);

  const body = await c.req.json<{ turnstileToken?: unknown } | null>().catch(() => null);
  const token = body?.turnstileToken;
  let human = false;
  if (typeof token === 'string' && token) {
    try {
      const res = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: c.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: c.req.header('CF-Connecting-IP'),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      human = (await res.json<{ success: boolean }>()).success === true;
    } catch (error) {
      console.error('Turnstile siteverify failed', error);
    }
  }
  if (!human) return c.json({ error: 'Security check failed', code: 'auth/captcha-failed' }, 403);
  await next();
});

/** Page hosting the widget, shown in an iframe (web) or WebView (native), which has no domain of its own. */
export function turnstilePage(siteKey: string, theme: 'light' | 'dark'): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Security check</title>
<style>body{margin:0;background:transparent}</style>
<script>
function send(token) {
  // The native bridge takes one argument; Android throws on a second.
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(token);
  else parent.postMessage({ turnstileToken: token }, '*'); // embedders are limited by frame-ancestors
}
function clearToken() { send(''); }
</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head><body>
<div class="cf-turnstile" data-sitekey="${siteKey}" data-size="flexible" data-theme="${theme}"
  data-callback="send" data-expired-callback="clearToken" data-error-callback="clearToken"></div>
</body></html>`;
}
