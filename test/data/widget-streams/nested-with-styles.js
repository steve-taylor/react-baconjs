import {combineAsArray, combineTemplate, constant} from 'baconjs';

import fetchV from '../streams/fetch-v';
import fetchW from '../streams/fetch-w';

export default function getData(props$, hydration) {
    const coefficient$ = props$.map(({coefficient = 1}) => coefficient);

    // Get {v, w} from hydration if hydrating, or from an external data source if not hydrating.
    const v$ = hydration
        ? constant(hydration.v)
        : fetchV();

    const w$ = hydration
        ? constant(hydration.w)
        : fetchW();

    // Calculate {a, b} based on v (from external data source) and coefficient (from props)
    const a$ = combineAsArray(v$, coefficient$).map(([v, coefficient]) => coefficient * v);
    const b$ = combineAsArray(w$, coefficient$).map(([w, coefficient]) => coefficient * w);

    return combineTemplate({
        state: {
            a: a$,
            b: b$,
        },
        hydration: {
            v: v$,
            w: w$,
        },
    });
}
