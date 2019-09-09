import {later} from 'baconjs';

// Simulated external data source
export default function fetchBaseValue() {
    return later(50, 5);
}
