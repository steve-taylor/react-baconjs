import {later} from 'baconjs';

// Simulated external data source
export default function fetchW() {
    return later(30, 8);
}
