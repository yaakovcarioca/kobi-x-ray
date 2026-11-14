import { readFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

export interface ViewerServer {
  server: Server;
  port: number;
  url: string;
}

function send(res: ServerResponse, status: number, type: string, body: Buffer | string): void {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-cache' });
  res.end(body);
}

/**
 * Serves the built web viewer plus the snapshot at `/api/snapshot`. Listens on
 * loopback only: the snapshot describes private source code.
 */
export async function startServer(webDir: string, snapshotJson: string, port: number): Promise<ViewerServer> {
  const gzipped = gzipSync(snapshotJson);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/api/snapshot') {
      const acceptsGzip = String(req.headers['accept-encoding'] ?? '').includes('gzip');
      res.writeHead(200, {
        'content-type': MIME['.json'],
        'cache-control': 'no-store',
        ...(acceptsGzip ? { 'content-encoding': 'gzip' } : {}),
      });
      res.end(acceptsGzip ? gzipped : snapshotJson);
      return;
    }

    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    const target = join(webDir, relative);
    if (target !== webDir && !target.startsWith(webDir + sep)) {
      send(res, 403, 'text/plain', 'Forbidden');
      return;
    }
    try {
      const file = relative === '' ? join(webDir, 'index.html') : target;
      send(res, 200, MIME[extname(file)] ?? 'application/octet-stream', await readFile(file));
    } catch {
      // Unknown routes fall back to the single-page app shell.
      try {
        send(res, 200, MIME['.html']!, await readFile(join(webDir, 'index.html')));
      } catch {
        send(res, 500, 'text/plain', 'Viewer assets are missing. Run `npm run build` first.');
      }
    }
  });

  // Walk forward from the requested port until one is free.
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = port + attempt;
    const bound = await new Promise<boolean>((resolve, reject) => {
      server.once('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') resolve(false);
        else reject(error);
      });
      server.listen(candidate, '127.0.0.1', () => resolve(true));
    });
    if (bound) return { server, port: candidate, url: `http://localhost:${candidate}` };
    server.removeAllListeners('error');
  }
  throw new Error(`No free port between ${port} and ${port + 19}`);
}
