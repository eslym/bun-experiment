import { render } from "react";

export function reswap(component: any, target: string, mode: 'outerHTML' | 'innerHTML' = 'outerHTML') {
    return new Response(
        render(component),
        {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache',
                'HX-Reswap': mode,
                'HX-Retarget': target,
            },
        },
    )
}