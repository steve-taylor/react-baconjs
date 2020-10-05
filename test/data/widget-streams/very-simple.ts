import {combineTemplate, Property} from 'baconjs';

export type VerySimpleProps = {
    power: number | null;
};

export type VerySimpleState = {
    x: number;
}

export type VerySimpleHydration = number

export type VerySimpleMeta = {
    state: VerySimpleState;
}

export function state(props$: Property<VerySimpleProps>): Property<VerySimpleState> {
    const power$ = props$.map(({power}) => power ?? 1);

    return combineTemplate({
        x: power$.map((power) => 5 ** power)
    })
}

export function dehydrate({x}: VerySimpleState): VerySimpleHydration {
    return x
}

export function hydrate(x: VerySimpleHydration): VerySimpleState {
    return {x}
}

export function meta() {
    return {}
}
