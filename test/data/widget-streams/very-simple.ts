import {combineTemplate, Property} from 'baconjs';

export type VerySimpleProps = {
    power: number | null;
};

export type VerySimpleState = {
    x?: number;
}

export type VerySimpleMeta = {
    state: VerySimpleState;
}

export type VerySimpleWidgetData = {
    state: VerySimpleState;
};

export function stream(props$: Property<VerySimpleProps>): Property<VerySimpleWidgetData> {
    const power$ = props$.map(({power}) => power === null ? 1 : power);

    return combineTemplate({
        state: {
            x: power$.map((power) => 5 ** power),
        },
    });
}

export const initialState: VerySimpleState = {};
