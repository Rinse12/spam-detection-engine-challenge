import type { IframeGeneratorOptions } from "./types.js";

export interface TurnstileIframeOptions extends IframeGeneratorOptions {
    /** Cloudflare Turnstile site key */
    siteKey?: string;
}

/**
 * Generate iframe HTML with Cloudflare Turnstile CAPTCHA.
 */
export function generateTurnstileIframe(options: TurnstileIframeOptions): string {
    const { challengeId, siteKey = "PLACEHOLDER_SITE_KEY" } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify you are human</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #333;
    }
    .cf-turnstile {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    .status {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      display: none;
    }
    .status.success {
      display: block;
      background: #d4edda;
      color: #155724;
    }
    .status.error {
      display: block;
      background: #f8d7da;
      color: #721c24;
    }
    .status.loading {
      display: block;
      background: #fff3cd;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verify you are human</h1>
    <div
      class="cf-turnstile"
      data-sitekey="${siteKey}"
      data-callback="onTurnstileSuccess"
      data-error-callback="onTurnstileError"
    ></div>
    <div id="status" class="status"></div>
  </div>

  <script>
    const challengeId = ${JSON.stringify(challengeId)};
    const statusEl = document.getElementById('status');

    function showStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = 'status ' + type;
    }

    function onTurnstileSuccess(turnstileToken) {
      showStatus('Verification successful! Completing...', 'loading');

      // Call server to get signed JWT
      fetch('/api/v1/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeId,
          challengeResponse: turnstileToken,
          challengeType: 'turnstile'
        })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success && data.token) {
          // Send JWT to parent window
          window.parent.postMessage({
            type: 'challenge-complete',
            token: data.token
          }, '*');
          showStatus('Verification complete!', 'success');
        } else {
          showStatus('Verification failed: ' + (data.error || 'Unknown error'), 'error');
          window.parent.postMessage({
            type: 'challenge-error',
            error: data.error || 'Token generation failed'
          }, '*');
        }
      })
      .catch(function(error) {
        showStatus('Verification failed: ' + error.message, 'error');
        window.parent.postMessage({
          type: 'challenge-error',
          error: error.message
        }, '*');
      });
    }

    function onTurnstileError(error) {
      showStatus('Verification failed. Please try again.', 'error');

      // Notify parent window of failure
      window.parent.postMessage({
        type: 'challenge-error',
        error: error || 'Unknown error'
      }, '*');
    }
  </script>
</body>
</html>`;
}
