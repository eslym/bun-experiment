import { render } from 'react';
import type { Server } from 'bun';
import { MethodNotAllowedPage, NotFoundPage, QuotePage } from 'pages';
import { exists } from 'fs/promises';
import { join } from 'path';
import { Quote } from 'components';
import { Router } from 'router';

const router = new Router<(req: Request, server: Server) => any>();

router.add('GET', '/', async (req, server) => {
    const res = await fetch('https://api.quotable.io/random');
    const quote = await res.json();

    if (req.headers.get('HX-Request') === 'true') {
        return Quote(quote);
    }

    return QuotePage(quote);
});

Bun.serve({
    port: process.env.PORT ?? 3000,
    fetch: async (req, server) => {
        const url = new URL(req.url);
        const route = router.resolve(req.method as any, url.pathname);
        if (route) {
            const res = await route.value(req, server);
            if (res instanceof Response) {
                return res;
            }
            if (res instanceof Blob || res instanceof ArrayBuffer) {
                const type = res instanceof Blob ? res.type : 'application/octet-stream';
                return new Response(res, { headers: { 'Content-Type': type } });
            }
            if ('type' in res && 'props' in res) {
                return new Response(render(res), { headers: { 'Content-Type': 'text/html' } });
            }
            return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
        }
        if (['HEAD', 'GET'].includes(req.method)) {
            const filepath = 'public' + join(url.pathname);
            if (await exists(filepath)) {
                return new Response(Bun.file(filepath));
            }
        }
        const page = ['HEAD', 'GET'].includes(req.method) ? NotFoundPage() : MethodNotAllowedPage();
        return new Response(render(page), { headers: { 'Content-Type': 'text/html' }, status: 404 });
    },
});
