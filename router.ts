interface ExactMatchRule {
    type: 'exact';
    match: string;
}

interface ParamMatchRule {
    type: 'param';
    pattern: string;
    params: string[];
}

type MatchRule = ExactMatchRule | ParamMatchRule;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

const matchRange = {
    d: '0-9',
    a: 'A-Za-z',
    '-': '\\-_',
} as Record<string, string>;

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileRule(rule: string): MatchRule {
    const regex = /(?:\[:([\w-]+)(?::([da-]+))?\]|:([\w-]+))/g;
    if (!regex.test(rule)) {
        return {
            type: 'exact',
            match: rule,
        };
    }
    const patternParts: string[] = [];
    const params = new Set<string>();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rule))) {
        if (match.index > lastIndex) {
            patternParts.push(escapeRegex(rule.slice(lastIndex, match.index)));
        }
        if (match[1] && match[2]) {
            const subRule = match[2]
                .split('')
                .map(c => matchRange[c] ?? c)
                .join('');
            patternParts.push(`(?<${match[1]}>[${subRule}]+)`);
            params.add(match[1]);
        } else if (match[1]) {
            patternParts.push(`(?<${match[1]}>.+)`);
            params.add(match[1]);
        } else {
            patternParts.push(`(?<${match[3]}>.+)`);
            params.add(match[3]);
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < rule.length) {
        patternParts.push(escapeRegex(rule.slice(lastIndex)));
    }
    return {
        type: 'param',
        pattern: `^${patternParts.join('')}$`,
        params: Array.from(params),
    };
}

class PathMatcher<T> {
    private excactRules = new Map<string, PathMatcher<T>>();
    private paramRules = new Map<string, PathMatcher<T>>();
    private catchAll?: T;

    private value?: T;

    add(rules: string[], value: T, catchAll = false) {
        if (rules.length === 0) {
            this[catchAll ? 'catchAll' : 'value'] = value;
            return;
        }
        const path = rules[0];
        const rest = rules.slice(1);
        const rule = compileRule(path);
        let matcher = rule.type === 'exact' ? this.excactRules.get(rule.match) : this.paramRules.get(rule.pattern);
        if (!matcher) {
            matcher = new PathMatcher<T>();
            if (rule.type === 'exact') {
                this.excactRules.set(rule.match, matcher);
            } else {
                this.paramRules.set(rule.pattern, matcher);
            }
        }
        matcher.add(rest, value);
    }

    resolve(path: string[], params: Record<string, any> = {}): { value: T; params: Record<string, any> } | undefined {
        if (path.length === 0) {
            return this.value ? { value: this.value, params } : undefined;
        }
        const current = path[0];
        const rest = path.slice(1);
        const exact = this.excactRules.get(current);
        let res = undefined;
        if (exact) {
            res = exact.resolve(rest, params);
            if (res) return res;
        }
        for (let [pattern, matcher] of this.paramRules) {
            const regex = new RegExp(pattern);
            const match = regex.exec(current);
            if (match) {
                for (let [key, value] of Object.entries(match.groups as Record<string, any>)) {
                    params[key] = value;
                }
                res = matcher.resolve(rest, params);
                if (res) return res;
            }
        }
        return this.catchAll ? { value: this.catchAll, params } : undefined;
    }
}

export class Router<T> {
    private matchers = new Map<Method, PathMatcher<T>>();

    add(method: Method, path: string, value: T) {
        let matcher = this.matchers.get(method);
        if (!matcher) {
            matcher = new PathMatcher<T>();
            this.matchers.set(method, matcher);
        }
        matcher.add(path.split('/').filter(Boolean), value);
    }

    catchAll(method: Method | 'HEAD', path: string, value: T) {
        if (method === 'HEAD') method = 'GET';
        let matcher = this.matchers.get(method);
        if (!matcher) {
            matcher = new PathMatcher<T>();
            this.matchers.set(method, matcher);
        }
        matcher.add(path.split('/').filter(Boolean), value, true);
    }

    group(pathPrefix: string): Router<T> {
        const proxy = new Proxy(this, {
            get(target, prop, receiver) {
                if (prop === 'group') return (path: string) => target.group(pathPrefix + path);
                if (prop === 'add')
                    return (method: Method, path: string, value: T) => target.add(method, pathPrefix + path, value);
                if (prop === 'catchAll')
                    return (method: Method, path: string, value: T) =>
                        target.catchAll(method, pathPrefix + path, value);
                return Reflect.get(target, prop, receiver);
            },
        });
        return proxy as Router<T>;
    }

    resolve(method: Method, path: string): { value: T; params: Record<string, any> } | undefined {
        const matcher = this.matchers.get(method);
        if (!matcher) return undefined;
        return matcher.resolve(path.split('/').filter(Boolean));
    }
}
