import {constant, Error as BaconError, Property} from 'baconjs';

export function state(): Property<{}> {
    return constant(null)
        .flatMapLatest<{}>(() => new BaconError('Nope!'))
        .toProperty()
}
