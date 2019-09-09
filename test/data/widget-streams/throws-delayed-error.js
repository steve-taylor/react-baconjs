import {Error as BaconError, later} from 'baconjs';

export default function getData() {
    return later(1, null)
        .flatMapLatest(() => new BaconError('Nope!'))
        .toProperty();
}
