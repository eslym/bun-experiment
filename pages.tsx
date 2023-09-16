import { Quote } from 'components';

const htmlxVersion = process.env.HTMX_VERSION ?? '1.9.5';

function Layout({
    title,
    children,
    head,
    bodyOnly,
}: {
    title: string;
    children?: any;
    head?: any;
    bodyOnly?: boolean;
}) {
    if (bodyOnly) {
        return <body>{children}</body>;
    }
    return (
        <>
            <util:raw>{'<!DOCTYPE html>'}</util:raw>
            <html lang='en'>
                <head>
                    <meta charset='utf-8' />
                    <meta name='viewport' content='width=device-width, initial-scale=1' />
                    <title>{title}</title>
                    <script
                        src={`https://unpkg.com/htmx.org@${htmlxVersion}`}
                        integrity='sha384-xcuj3WpfgjlKF+FXhSQFQ0ZNr39ln+hwjN3npfM9VBnUskLolQAcN80McRIVOPuO'
                        crossorigin='anonymous'
                    ></script>
                    <link rel='preconnect' href='https://fonts.googleapis.com'></link>
                    <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin></link>
                    <link
                        href='https://fonts.googleapis.com/css2?family=Noto+Emoji&display=swap'
                        rel='stylesheet'
                    ></link>
                    <link
                        href='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap'
                        rel='stylesheet'
                    ></link>
                    <link
                        href='https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap'
                        rel='stylesheet'
                    ></link>
                    <link
                        href='https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;300;400;500;700;900&display=swap'
                        rel='stylesheet'
                    ></link>
                    <link
                        href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100;300;400;500;700;900&display=swap'
                        rel='stylesheet'
                    ></link>
                    <link rel='stylesheet' href='/styles/main.css' />
                    {head}
                </head>
                <body>{children}</body>
            </html>
        </>
    );
}

export function ErrorLayout(props: { title: string; children?: any; emoji?: string; bodyOnly?: boolean }) {
    return (
        <Layout title={props.title} bodyOnly={props.bodyOnly}>
            <div class='error-page'>
                <h1>
                    {props.emoji ? props.emoji + ' ' : ''}
                    {props.title}
                </h1>
                {props.children}
                <div hx-boost style='padding-top: 1em;'>
                    <a href='/' class='button'>
                        Go Home
                    </a>
                </div>
            </div>
        </Layout>
    );
}

export function NotFoundPage(props: { bodyOnly?: boolean } = {}) {
    return (
        <ErrorLayout title='404 Not Found' emoji='😅' bodyOnly={props.bodyOnly}>
            <p>The page you are looking for does not exist.</p>
        </ErrorLayout>
    );
}

export function MethodNotAllowedPage(props: { bodyOnly?: boolean } = {}) {
    return (
        <ErrorLayout title='405 Method Not Allowed' emoji='🖐️' bodyOnly={props.bodyOnly}>
            <p>The method you are using is not allowed.</p>
        </ErrorLayout>
    );
}

export function InternalServerErrorPage(props: { bodyOnly?: boolean } = {}) {
    return (
        <ErrorLayout title='500 Internal Server Error' emoji='😱' bodyOnly={props.bodyOnly}>
            <p>Something went wrong.</p>
        </ErrorLayout>
    );
}

export function QuotePage(props: { content: string; author: string; bodyOnly?: boolean }) {
    return (
        <Layout title='Random Quote' bodyOnly={props.bodyOnly}>
            <div class='quote-page'>
                <h1>Random Quote</h1>
                <Quote content={props.content} author={props.author} />
                <div style='padding-top: 1em;'>
                    <button hx-get='/' hx-swap='outerHTML' hx-target='#quote-content' style='margin-top: 1em;'>
                        Next Quote
                    </button>
                </div>
            </div>
        </Layout>
    );
}
