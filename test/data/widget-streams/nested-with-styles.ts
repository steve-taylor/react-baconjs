import {combineAsArray, combineTemplate, constant, Property} from 'baconjs';

import fetchV from '../streams/fetch-v';
import fetchW from '../streams/fetch-w';

export type Props = {
    coefficient: number | null;
};

export type State = {
    a?: number;
    b?: number;
};

export type Hydration = {
    v: number;
    w: number;
};

export type WidgetData = {
    state: State;
    hydration?: Hydration;
};

export function stream(props$: Property<Props>, hydration: Hydration | undefined): Property<WidgetData> {
    const coefficient$ = props$.map(({coefficient}) => coefficient === null ? 1 : coefficient);

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

export const initialState: State = {};
