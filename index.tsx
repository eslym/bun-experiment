import { render } from 'react';
import type { Server } from 'bun';

function Layout({ title, children }: { title: string; children?: any }) {
    return (
        <>
            <util:raw>{'<!DOCTYPE html>'}</util:raw>
            <html lang='en'>
                <head>
                    <meta charset='utf-8' />
                    <title>{title}</title>
                    <script
                        src='https://unpkg.com/htmx.org@1.9.5'
                        integrity='sha384-xcuj3WpfgjlKF+FXhSQFQ0ZNr39ln+hwjN3npfM9VBnUskLolQAcN80McRIVOPuO'
                        crossorigin='anonymous'
                    ></script>
                </head>
                <body>{children}</body>
            </html>
        </>
    );
}

function Quote({ content, author }: { content: string; author: string }) {
    return (
        <blockquote id='quote-content'>
            <p>{content}</p>
            <footer>—— {author}</footer>
        </blockquote>
    );
}

const routes = new Map<string, (req: Request, server: Server) => any>();

routes.set('/', async (req, server) => {
    const res = await fetch('https://api.quotable.io/random');
    const quote = await res.json();

    if (req.headers.get('HX-Request') === 'true') {
        return <Quote content={quote.content} author={quote.author} />;
    }

    return (
        <Layout title='Random Quote'>
            <h1>Random Quote</h1>
            <Quote content={quote.content} author={quote.author} />
            <button hx-get='/' hx-swap='outerHTML' hx-target='#quote-content'>
                Next Quote
            </button>
        </Layout>
    );
});

Bun.serve({
    port: process.env.PORT ?? 3000,
    fetch: async (req, server) => {
        const url = new URL(req.url);
        const route = routes.get(url.pathname);
        if (route) {
            const res = await route(req, server);
            if (res instanceof Response) {
                return res;
            }
            if (res instanceof Blob || res instanceof ArrayBuffer) {
                return new Response(res, { headers: { 'Content-Type': 'application/octet-stream' } });
            }
            if ('type' in res && 'props' in res) {
                return new Response(render(res), { headers: { 'Content-Type': 'text/html' } });
            }
            return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
        }

        const notFound = (
            <Layout title='404 Not Found'>
                <h1>404 Not Found</h1>
                <p>The page you are looking for does not exist.</p>
            </Layout>
        );

        return new Response(render(notFound), { headers: { 'Content-Type': 'text/html' }, status: 404 });
    },
});
