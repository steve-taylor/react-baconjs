import {combineAsArray, combineTemplate, constant} from 'baconjs';

import fetchBaseValue from '../streams/fetch-base-value';

export default function getData(props$, hydration) {
    const power$ = props$.map(({power = 1}) => power);

    // Get baseValue from hydration if hydrating, or from an external data source if not hydrating.
    const baseValue$ = hydration
        ? constant(hydration.baseValue)
        : fetchBaseValue();

    // Calculate x based on baseValue (from external data source) and power (from props)
    const x$ = combineAsArray(baseValue$, power$).map(([baseValue, power]) => baseValue ** power);

    return combineTemplate({
        state: {
            x: x$,
        },
        hydration: {
            baseValue: baseValue$,
        },
        data: {
            maxAge: 60,
        },
    });
}
