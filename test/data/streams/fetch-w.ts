import {later, EventStream} from 'baconjs';

// Simulated external data source
export default function fetchW(): EventStream<number> {
    return later(30, 8);
}
