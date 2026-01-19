/**
 * OAuth challenge iframe generator.
 * Displays sign-in buttons for configured OAuth providers.
 */

import type { IframeGeneratorOptions, OAuthProvider } from "./types.js";

export interface OAuthIframeOptions extends IframeGeneratorOptions {
    /** List of enabled OAuth providers to display */
    enabledProviders: OAuthProvider[];
    /** Base URL of the server */
    baseUrl: string;
}

/**
 * Provider display configuration.
 */
const PROVIDER_CONFIG: Record<OAuthProvider, { name: string; color: string; hoverColor: string; icon: string }> = {
    github: {
        name: "GitHub",
        color: "#24292e",
        hoverColor: "#1a1e22",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`
    },
    google: {
        name: "Google",
        color: "#ffffff",
        hoverColor: "#f5f5f5",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`
    },
    facebook: {
        name: "Facebook",
        color: "#1877f2",
        hoverColor: "#166fe5",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
    },
    apple: {
        name: "Apple",
        color: "#000000",
        hoverColor: "#1a1a1a",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`
    },
    twitter: {
        name: "X (Twitter)",
        color: "#000000",
        hoverColor: "#1a1a1a",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    }
};

/**
 * Generate OAuth challenge iframe HTML.
 * Displays sign-in buttons for all enabled providers.
 */
export function generateOAuthIframe(options: OAuthIframeOptions): string {
    const { sessionId, enabledProviders, baseUrl } = options;

    // Generate button HTML for each enabled provider
    const buttons = enabledProviders
        .map((provider) => {
            const config = PROVIDER_CONFIG[provider];
            const isLight = provider === "google";
            return `
                <button
                    onclick="startOAuth('${provider}')"
                    class="oauth-btn ${isLight ? "light" : ""}"
                    style="background-color: ${config.color};"
                    onmouseover="this.style.backgroundColor='${config.hoverColor}'"
                    onmouseout="this.style.backgroundColor='${config.color}'"
                >
                    <span class="icon">${config.icon}</span>
                    <span>Sign in with ${config.name}</span>
                </button>
            `;
        })
        .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to verify</title>
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
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #333;
        }
        .subtitle {
            color: #666;
            margin-bottom: 25px;
            font-size: 0.95rem;
        }
        .oauth-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .oauth-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            width: 100%;
        }
        .oauth-btn:hover {
            transform: translateY(-1px);
        }
        .oauth-btn:active {
            transform: translateY(0);
        }
        .oauth-btn.light {
            color: #333;
            border: 1px solid #ddd;
        }
        .oauth-btn .icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .status {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            display: none;
            font-size: 0.95rem;
        }
        .status.loading {
            display: block;
            background: #e3f2fd;
            color: #1565c0;
        }
        .status.success {
            display: block;
            background: #e8f5e9;
            color: #2e7d32;
        }
        .status.error {
            display: block;
            background: #ffebee;
            color: #c62828;
        }
        .privacy-note {
            margin-top: 20px;
            font-size: 0.8rem;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Verify your identity</h1>
        <p class="subtitle">Sign in with any account to continue</p>

        <div id="buttons" class="oauth-buttons">
            ${buttons}
        </div>

        <div id="status" class="status"></div>

        <p class="privacy-note">
            Your account info is not shared with the subplebbit.<br>
            We only verify that you signed in successfully.
        </p>
    </div>

    <script>
        const sessionId = ${JSON.stringify(sessionId)};
        const baseUrl = ${JSON.stringify(baseUrl)};
        let pollInterval = null;
        let isCompleted = false;

        function startOAuth(provider) {
            // Open OAuth in new tab
            const url = baseUrl + '/api/v1/oauth/' + provider + '/start?sessionId=' + encodeURIComponent(sessionId);
            window.open(url, '_blank');

            // Start polling for completion
            startPolling();
        }

        function showStatus(message, type) {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = 'status ' + type;
        }

        function startPolling() {
            if (pollInterval || isCompleted) return;

            showStatus('Waiting for sign-in to complete...', 'loading');

            pollInterval = setInterval(async function() {
                try {
                    const resp = await fetch(baseUrl + '/api/v1/oauth/status/' + encodeURIComponent(sessionId));
                    const data = await resp.json();

                    if (data.completed) {
                        isCompleted = true;
                        clearInterval(pollInterval);
                        pollInterval = null;
                        document.getElementById('buttons').style.display = 'none';
                        showStatus('Verification complete! Click "done" in your plebbit client to continue.', 'success');
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
            }, 2000);
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        });
    </script>
</body>
</html>`;
}
