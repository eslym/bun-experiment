// a very simple react runtime for bun to do server-side rendering

const selfClosingTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

const noEscapeTags = new Set(['script', 'style']);

function noEscape(str: string | number | boolean | object) {
    return `${str}`;
}

function* renderAttributes(props: Record<string, any>, classList: Set<string>) {
    for (let [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) {
            continue;
        }
        if (key === 'children') {
            continue;
        }
        if (key === 'class') {
            if (typeof value === 'string') {
                const classes = value.split(/\s+/);
                for (let cls of classes) {
                    classList.add(cls);
                }
            } else if (value[Symbol.iterator]) {
                for (let cls of value) {
                    classList.add(cls);
                }
            }
            continue;
        }
        if (key.startsWith('class:')) {
            if (value) {
                classList.add(key.slice(6));
            }
            continue;
        }
        if (key === 'style' && typeof value === 'object') {
            value = Object.entries(value)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');
        }
        yield ` ${key}="${Bun.escapeHTML(value)}"`;
    }
    if (classList.size) {
        yield ` class="${Array.from(classList).join(' ')}"`;
    }
}

function* renderChild(child: any, escape = Bun.escapeHTML): Generator<string> {
    if (child === undefined || child === null) {
        return;
    }
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
        yield escape(child);
        return;
    }
    if ('type' in child && 'props' in child) {
        yield* renderVNode(child, escape);
        return;
    }
    if (child[Symbol.iterator]) {
        for (let item of child) {
            yield* renderChild(item, escape);
        }
        return;
    }
    yield escape(child);
}

function* renderVNode({ type, props }: { type: string | Function; props: any }, escape = Bun.escapeHTML) {
    if (typeof type === 'function') {
        yield* renderChild(type(props), escape);
        return;
    }
    if (type === 'util:raw') {
        if (typeof props.children === 'string' || !(Symbol.iterator in props.children)) {
            yield props.children;
            return;
        }
        for (let child of props.children) {
            yield `${child}`;
        }
        return;
    }
    if (type === 'util:fragment') {
        yield* renderChild(props.children, escape);
        return;
    }
    yield `<${type}`;
    const classList = new Set<string>();
    yield* renderAttributes(props, classList);
    if (selfClosingTags.has(type)) {
        yield '/>';
        return;
    }
    yield '>';
    yield* renderChild(props.children, noEscapeTags.has(type) ? noEscape : escape);
    yield `</${type}>`;
}

export function render(vnode: any) {
    return Array.from(renderVNode(vnode)).join('');
}

export function jsx(type: string | Function, props: any) {
    return { type, props };
}

export function Fragment(props: any) {
    return {
        type: 'util:fragment',
        props,
    };
}

export { jsx as jsxs, jsx as jsxDEV };
