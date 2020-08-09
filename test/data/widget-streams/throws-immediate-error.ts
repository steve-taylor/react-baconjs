import {constant, Error as BaconError} from 'baconjs';

export function stream() {
    return constant(null)
        .flatMapLatest<{state: {}}>(() => new BaconError('Nope!'))
        .toProperty();
}

export const initialState = {};
