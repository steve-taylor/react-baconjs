import {Error as BaconError, later, Property} from 'baconjs';
export function stream() {
    return later(1, null)
        .flatMapLatest<{state: {}}>(() => new BaconError('Nope!'))
        .toProperty();
}

export const initialState = {};
