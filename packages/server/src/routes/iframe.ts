import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import { IframeParamsSchema, type IframeParams } from "./schemas.js";
import { refreshIpIntelIfNeeded } from "../ip-intel/index.js";

export interface IframeRouteOptions {
  db: SpamDetectionDatabase;
  turnstileSiteKey?: string;
  ipInfoToken?: string;
}

/**
 * Register the /api/v1/iframe/:challengeId route.
 */
export function registerIframeRoute(
  fastify: FastifyInstance,
  options: IframeRouteOptions
): void {
  const { db, turnstileSiteKey, ipInfoToken } = options;

  fastify.get(
    "/api/v1/iframe/:challengeId",
    async (
      request: FastifyRequest<{ Params: IframeParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      // Validate params
      const parseResult = IframeParamsSchema.safeParse(request.params);

      if (!parseResult.success) {
        reply.status(400);
        reply.send("Invalid challenge ID");
        return;
      }

      const { challengeId } = parseResult.data;

      // Look up challenge session
      const session = db.getChallengeSessionByChallengeId(challengeId);

      if (!session) {
        reply.status(404);
        reply.send("Challenge not found");
        return;
      }

      // Check if challenge has expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expiresAt < now) {
        reply.status(410);
        reply.send("Challenge has expired");
        return;
      }

      // Check if challenge was already completed
      if (session.status === "completed") {
        reply.status(409);
        reply.send("Challenge already completed");
        return;
      }

      // Get client IP for IP record
      const clientIp = getClientIp(request); // TODO why string | undefined? Shouldn't it always be defined?

      // Store IP record

      if (clientIp) {
        // why remove old ip records?
        db.upsertIpRecord({
          ipAddress: clientIp,
          author: session.author,
          challengeId,
        });

        if (ipInfoToken) {
          void refreshIpIntelIfNeeded({
            db,
            ipAddress: clientIp,
            author: session.author,
            token: ipInfoToken,
          }).catch((error) => {
            request.log.warn({ err: error }, "Failed to refresh IP intelligence");
          });
        }
      }

      // Serve the iframe HTML
      // TODO: This will be replaced with actual static files from challenge-iframe/
      const html = generateIframeHtml(challengeId, turnstileSiteKey);

      reply.type("text/html");
      reply.send(html);
    }
  );
}

/**
 * Get client IP address from request.
 */
function getClientIp(request: FastifyRequest): string | undefined {
  // Check common proxy headers
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }

  const realIp = request.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to direct connection IP
  return request.ip;
}

/**
 * Generate iframe HTML with Turnstile CAPTCHA.
 * TODO: This is a placeholder - real implementation will use static files.
 */
function generateIframeHtml(
  challengeId: string,
  turnstileSiteKey?: string
): string {
  const siteKey = turnstileSiteKey ?? "PLACEHOLDER_SITE_KEY";

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

    function onTurnstileSuccess(token) {
      showStatus('Verification successful! Completing...', 'loading');

      // Generate a simple token (placeholder - real implementation will use JWT)
      const challengeToken = btoa(JSON.stringify({
        challengeId: challengeId,
        turnstileToken: token,
        completedAt: Date.now()
      }));

      // Send token to parent window
      window.parent.postMessage({
        type: 'challenge-complete',
        token: challengeToken
      }, '*');

      showStatus('Verification complete!', 'success');
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
