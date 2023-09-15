import { Quote } from 'components';

const htmlxVersion = process.env.HTMX_VERSION ?? '1.9.5';

function Layout({ title, children }: { title: string; children?: any }) {
    return (
        <>
            <util:raw>{'<!DOCTYPE html>'}</util:raw>
            <html lang='en'>
                <head>
                    <meta charset='utf-8' />
                    <title>{title}</title>
                    <script
                        src={`https://unpkg.com/htmx.org@${htmlxVersion}`}
                        integrity='sha384-xcuj3WpfgjlKF+FXhSQFQ0ZNr39ln+hwjN3npfM9VBnUskLolQAcN80McRIVOPuO'
                        crossorigin='anonymous'
                    ></script>
                    <script
                        src={`https://unpkg.com/htmx.org@${htmlxVersion}/dist/ext/ws.js`}
                        integrity='sha384-n4Obcu5jj0O7MH5TX7xlQVG8JS9iSIJ1ZXz34PjtLp24Uwyi+PyeyPvED6rZP2t9'
                        crossorigin='anonymous'
                    ></script>
                </head>
                <body>{children}</body>
            </html>
        </>
    );
}

export function NotFoundPage() {
    return (
        <Layout title='404 Not Found'>
            <h1>404 Not Found</h1>
            <p>The page you are looking for does not exist.</p>
        </Layout>
    );
}

export function MethodNotAllowedPage() {
    return (
        <Layout title='405 Method Not Allowed'>
            <h1>405 Method Not Allowed</h1>
            <p>The method you are using is not allowed.</p>
        </Layout>
    );
}

export function QuotePage({ content, author }: { content: string; author: string }) {
    return (
        <Layout title='Random Quote'>
            <h1>Random Quote</h1>
            <Quote content={content} author={author} />
            <button hx-get='/' hx-swap='outerHTML' hx-target='#quote-content'>
                Next Quote
            </button>
        </Layout>
    );
}
