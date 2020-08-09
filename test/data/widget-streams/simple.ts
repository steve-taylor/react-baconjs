import {combineAsArray, constant, Property, combineTemplate} from 'baconjs';

import fetchBaseValue from '../streams/fetch-base-value';

export type Props = {
    power?: number;
};

export type State = {
    x?: number;
};

export type Hydration = {
    baseValue: number;
};

export type Meta = {
    maxAge: number;
};

export type WidgetData = {
    state: State;
    hydration?: Hydration;
    data?: Meta;
};

export function stream(props$: Property<Props>, hydration: Hydration | undefined): Property<WidgetData> {
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
        date: {
            maxAge: 60,
        },
    });
}

export const initialState: State = {};
