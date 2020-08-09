import {later, EventStream} from 'baconjs';

// Simulated external data source
export default function fetchBaseValue(): EventStream<number> {
    return later(50, 5);
}
