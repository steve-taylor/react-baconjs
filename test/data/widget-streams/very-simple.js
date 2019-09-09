import {combineTemplate} from 'baconjs';

export default function getData(props$) {
    const power$ = props$.map(({power = 1}) => power);

    return combineTemplate({
        state: {
            x: power$.map((power) => 5 ** power),
        },
    });
}
