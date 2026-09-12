const express = require("express");
const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");
const devServerManager = require("../services/DevServerManager");

const router = express.Router({ mergeParams: true });

// Dynamic proxy cache: key (${projectId}:${port} or ${port}) -> middleware
const proxyCache = new Map();

function getProxyForProjectAndPort(projectId, port) {
  const cacheKey = projectId ? `${projectId}:${port}` : `${port}`;
  if (proxyCache.has(cacheKey)) {
    return proxyCache.get(cacheKey);
  }

  const prefix = projectId ? `/api/project/${projectId}/preview/${port}` : `/preview/${port}`;

  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    selfHandleResponse: true,
    pathRewrite: (pathStr) => {
      // Strip out /api/project/:projectId/preview/:port or /preview/:projectId/:port or /preview/:port
      let stripped = pathStr
        .replace(new RegExp(`^/api/project/[^/]+/preview/${port}`), "")
        .replace(new RegExp(`^/preview/[^/]+/${port}`), "")
        .replace(new RegExp(`^/preview/${port}`), "");
      return stripped || "/";
    },
    on: {
      proxyReq: (proxyReq, req) => {
        // Rewrite host header to match target dev server
        proxyReq.setHeader("host", `127.0.0.1:${port}`);
        proxyReq.setHeader("origin", `http://127.0.0.1:${port}`);
        // Avoid compression so responseInterceptor can inspect HTML / JS
        proxyReq.setHeader("accept-encoding", "identity");

        console.log(`[Preview] Incoming request: ${req.method} ${req.originalUrl || req.url} -> http://127.0.0.1:${port}${proxyReq.path}`);
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const contentType = proxyRes.headers["content-type"] || "";
        const statusCode = proxyRes.statusCode || 200;

        console.log(`[Preview] target=http://127.0.0.1:${port} proxyUrl=${req.originalUrl || req.url} status=${statusCode}`);

        // 1. Rewrite HTML pages to inject base and rewrite root-relative asset URLs
        if (contentType.includes("text/html")) {
          let html = responseBuffer.toString("utf8");

          // Rewrite root-relative script/link/img tags: src="/... -> src="${prefix}/...
          html = html.replace(/(src|href)=(["'])\/(?!\/)(?!api\/project\/)(?!preview\/)(.*?)\2/gi, `$1=$2${prefix}/$3$2`);

          // Ensure base tag is present
          if (html.includes("<head>")) {
            html = html.replace("<head>", `<head><base href="${prefix}/" />`);
          } else if (html.includes("<html>")) {
            html = html.replace("<html>", `<html><head><base href="${prefix}/" /></head>`);
          }

          return html;
        }

        // 2. Rewrite JS / module imports (Vite client, jsx, tsx, js modules)
        if (
          contentType.includes("application/javascript") ||
          contentType.includes("text/javascript") ||
          (req.url && (req.url.endsWith(".jsx") || req.url.endsWith(".tsx") || req.url.endsWith(".js") || req.url.endsWith(".ts") || req.url.includes("@vite") || req.url.includes("@fs")))
        ) {
          let js = responseBuffer.toString("utf8");
          // Rewrite root imports: from "/..." -> from "${prefix}/..."
          js = js.replace(/from\s+([\"\'])\/(?!\/)(?!api\/project\/)(?!preview\/)([^\'\"]+)([\"\'])/g, `from $1${prefix}/$2$3`);
          js = js.replace(/import\s+([\"\'])\/(?!\/)(?!api\/project\/)(?!preview\/)([^\'\"]+)([\"\'])/g, `import $1${prefix}/$2$3`);
          js = js.replace(/import\s*\(\s*([\"\'])\/(?!\/)(?!api\/project\/)(?!preview\/)([^\'\"]+)([\"\'])\s*\)/g, `import($1${prefix}/$2$3)`);
          return js;
        }

        return responseBuffer;
      }),
      error: (err, req, res) => {
        console.error(`[Preview Error] target=http://127.0.0.1:${port} error:`, err.message);
        if (!res) return;

        // If res is a net.Socket (WebSocket upgrade error)
        if (typeof res.writeHead !== "function" && typeof res.status !== "function") {
          try {
            if (typeof res.end === "function") {
              res.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
            } else if (typeof res.destroy === "function") {
              res.destroy();
            }
          } catch (_) {}
          return;
        }

        if (res.headersSent || res.writableEnded) {
          return;
        }

        const errorHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Dev Server Connecting...</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B1220; color: #E6EDF3; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                  .card { background: #161F30; border: 1px solid #2A374E; padding: 2rem; border-radius: 12px; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                  h2 { margin-top: 0; color: #38BDF8; font-size: 1.25rem; }
                  p { color: #94A3B8; font-size: 0.875rem; line-height: 1.5; }
                  .badge { background: rgba(56, 189, 248, 0.15); color: #38BDF8; padding: 0.25rem 0.75rem; border-radius: 9999px; font-family: monospace; font-size: 0.75rem; display: inline-block; margin-bottom: 1rem; }
                  .btn { background: #0284C7; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 1rem; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="badge">Port ${port}</div>
                  <h2>Connecting to Development Server</h2>
                  <p>The workspace dev server is initializing or waiting for requests. If you haven't started it yet, run <code>npm run dev</code> in the DevCollab terminal.</p>
                  <a href="javascript:location.reload()" class="btn">Retry Connection</a>
                </div>
              </body>
            </html>
        `;

        try {
          if (typeof res.status === "function") {
            res.status(502).send(errorHtml);
          } else if (typeof res.writeHead === "function") {
            res.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
            res.end(errorHtml);
          }
        } catch (sendErr) {
          console.error(`[Preview Error] Failed to send 502 response:`, sendErr.message);
        }
      },
    },
  });

  proxyCache.set(cacheKey, proxy);
  return proxy;
}

function getProxyForPort(port) {
  return getProxyForProjectAndPort(null, port);
}

/**
 * GET active dev servers for project
 */
router.get("/:id/dev-servers", (req, res) => {
  const servers = devServerManager.getServersForProject(req.params.id);
  res.json({ servers });
});

/**
 * Handle HTTP proxy requests for /api/project/:id/preview/:port
 */
router.use("/:id/preview/:port", (req, res, next) => {
  const port = parseInt(req.params.port, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    return res.status(400).json({ error: "Invalid port number" });
  }

  const proxy = getProxyForProjectAndPort(req.params.id, port);
  proxy(req, res, next);
});

module.exports = router;
module.exports.getProxyForPort = getProxyForPort;
module.exports.getProxyForProjectAndPort = getProxyForProjectAndPort;

