import { render } from 'react';
import type { Server } from 'bun';
import { InternalServerErrorPage, MethodNotAllowedPage, NotFoundPage, QuotePage } from 'pages';
import { exists } from 'fs/promises';
import { join } from 'path';
import { Quote } from 'components';
import { Router } from 'router';
import { compileString } from 'sass';
import { reswap } from 'htmx';

const router = new Router<(req: Request, server: Server, params: Record<string, string>, next: () => any) => any>();

const cssCache = new Map<string, Response>();

router.add('GET', '/styles/:file.css', async (_req, _srv, params, next) => {
    if (cssCache.has(params.file)) {
        return cssCache.get(params.file);
    }
    const filepath = join('styles', params.file + '.scss');
    if (await exists(filepath)) {
        const scss = await Bun.file(filepath).text();
        const compiled = compileString(scss, { style: 'compressed' });
        const res = new Response(compiled.css, { headers: { 'Content-Type': 'text/css' } });
        if (process.env.NODE_ENV === 'production') {
            res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            cssCache.set(params.file, res);
        }
        return res;
    }
    return next();
});

router.add('GET', '/', async (req, server) => {
    const res = await fetch('https://api.quotable.io/random');
    const quote = await res.json();

    if (req.headers.get('HX-Boosted') === 'true') {
        return reswap(
            QuotePage({
                ...quote,
                bodyOnly: true,
            }),
            'body',
        );
    }

    if (req.headers.get('HX-Request') === 'true') {
        return Quote(quote);
    }

    return QuotePage(quote);
});

Bun.serve({
    port: process.env.PORT ?? 3000,
    fetch: async (req, server) => {
        async function next() {
            const isGet = ['HEAD', 'GET'].includes(req.method);
            if (isGet) {
                const filepath = 'public' + join(url.pathname);
                if (await exists(filepath)) {
                    return new Response(Bun.file(filepath));
                }
            }
            const page = isGet ? NotFoundPage : MethodNotAllowedPage;
            if (req.headers.get('HX-Request') === 'true') {
                return reswap(page(), 'body');
            }
            return new Response(render(page()), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                status: 404,
            });
        }
        const url = new URL(req.url);
        const route = router.resolve(req.method as any, url.pathname);
        if (route) {
            const res = await route.value(req, server, route.params, next);
            if (res instanceof Response) {
                return res;
            }
            if (res instanceof Blob || res instanceof ArrayBuffer) {
                const type = res instanceof Blob ? res.type : 'application/octet-stream';
                return new Response(res, { headers: { 'Content-Type': type } });
            }
            if ('type' in res && 'props' in res) {
                return new Response(render(res), {
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache',
                    },
                });
            }
            return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
        }
        return next();
    },
    error:
        process.env.NODE_ENV === 'production'
            ? undefined
            : error => {
                  console.error(error);
                  return new Response(render(InternalServerErrorPage()), {
                      headers: { 'Content-Type': 'text/html; charset=utf-8' },
                      status: 500,
                  });
              },
});
