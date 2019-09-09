import {constant, Error as BaconError} from 'baconjs';

export default function getData() {
    return constant(null)
        .flatMapLatest(() => new BaconError('Nope!'))
        .toProperty();
}
