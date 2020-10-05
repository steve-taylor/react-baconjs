import {combineTemplate, combineWith, Property} from 'baconjs'

import fetchBaseValue from '../streams/fetch-base-value'

export type Props = {
    power: number | null
}

export type State = {
    x: number
    baseValue: number
}

export type Hydration = number

export type Meta = {
    maxAge: number
}

export function state(props$: Property<Props>): Property<State> {
    const power$ = props$.map(({power}) => power ?? 1)
    const baseValue$ = props$.first().flatMapLatest(() => fetchBaseValue())
    const x$ = combineWith((baseValue, power) => baseValue ** power, baseValue$, power$)

    return combineTemplate({
        x: x$,
        baseValue: baseValue$,
    })
}

export function dehydrate({baseValue}: State): Hydration {
    return baseValue
}

export function hydrate(baseValue: Hydration, {power}: Props): State {
    return {
        x: baseValue ** (power ?? 1),
        baseValue,
    }
}

export function meta(): Meta {
    return {maxAge: 60}
}
