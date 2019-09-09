import {combineAsArray, combineTemplate, constant} from 'baconjs';

import fetchV from '../streams/fetch-v';
import fetchW from '../streams/fetch-w';

export default function getData(props$, hydration, immediate) {
    const coefficient$ = props$.map(({coefficient = 1}) => coefficient);

    // Get {v, w} from hydration if hydrating, or from an external data source if not hydrating.
    const v$ = hydration
        ? constant(hydration.v)
        : fetchV().toProperty();

    const w$ = hydration
        ? constant(hydration.w)
        : fetchW().toProperty();

    // Calculate {a, b} based on v (from external data source) and coefficient (from props)
    const a$ = combineAsArray(v$, coefficient$).map(([v, coefficient]) => coefficient * v);
    const b$ = combineAsArray(w$, coefficient$).map(([w, coefficient]) => coefficient * w);

    return combineTemplate({
        state: {
            isLoading: false,
            a: a$,
            b: b$,
        },
        hydration: {
            v: v$,
            w: w$,
        },
        data: {
            maxAge: 30,
        },
    })
        // Start with a loading state (which is skipped by Bacon.js when combineTemplate resolves immediately) ...
        .startWith({
            state: {
                isLoading: true,
            },
        })
        // ... but skip it if we're not required to immediately produce an event
        .skip(immediate ? 0 : 1);
}
