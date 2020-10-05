import {combineAsArray, combineTemplate, Property} from 'baconjs'

import fetchV from '../streams/fetch-v'
import fetchW from '../streams/fetch-w'

export type Props = {
    coefficient: number | null
}

export type State = {
    a: number
    b: number
    v: number
    w: number
}

export type Hydration = [number, number] // [v, w]

export type Meta = {
    maxAge: number
}

export function state(props$: Property<Props>): Property<State> {
    const coefficient$ = props$.map(({coefficient}) => coefficient ?? 1)
    const v$ = props$.first().flatMapLatest(() => fetchV())
    const w$ = props$.first().flatMapLatest(() => fetchW())

    return combineTemplate({
        a: combineAsArray(v$, coefficient$).map(([v, coefficient]) => coefficient * v),
        b: combineAsArray(w$, coefficient$).map(([w, coefficient]) => coefficient * w),
        v: v$,
        w: w$,
    })
}

export function dehydrate({v, w}: State): Hydration {
    return [v, w]
}

export function hydrate([v, w]: Hydration, {coefficient}: Props): State {
    return {
        a: (coefficient ?? 1) * v,
        b: (coefficient ?? 1) * w,
        v,
        w,
    }
}

export function meta(): Meta {
    return {maxAge: 30}
}
