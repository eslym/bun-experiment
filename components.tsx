export function Quote({ content, author }: { content: string; author: string }) {
    return (
        <blockquote id='quote-content'>
            <p>{content}</p>
            <footer>—— {author}</footer>
        </blockquote>
    );
}
