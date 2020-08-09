import {later, EventStream} from 'baconjs';

// Simulated external data source
export default function fetchV(): EventStream<number> {
    return later(50, 3);
}
