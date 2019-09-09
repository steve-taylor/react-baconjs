import {later} from 'baconjs';

// Simulated external data source
export default function fetchV() {
    return later(50, 3);
}
