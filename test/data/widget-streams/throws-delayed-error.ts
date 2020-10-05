import {Error as BaconError, later, Property} from 'baconjs'

export function state(): Property<{}> {
    return later(1, null)
        .flatMapLatest<{}>(() => new BaconError('Nope!'))
        .toProperty()
}
