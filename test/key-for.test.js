import keyFor from '../src/key-for';

describe('keyFor', () => {
    test('it disregards property order', () => {
        expect(keyFor({a: 1, b: 'two', c: null})).toBe(keyFor({c: null, a: 1, b: 'two'}));
    });

    test('it disregards undefined values', () => {
        expect(keyFor({a: 1, b: undefined})).toBe(keyFor({a: 1}));
    });

    test('it disregards functions', () => {
        expect(keyFor({a: 1, b() { console.log('Hello'); }})).toBe(keyFor({a: 1}));
    });

    test('it disregards symbols', () => {
        expect(keyFor({a: 1, b: Symbol('test')})).toBe(keyFor({a: 1}));
    });

    test('it disregards property order, undefined, function and symbols deeply', () => {
        expect(
            keyFor({
                a: 1,
                b: {
                    c: {
                        d: 'two',
                        e: null,
                    },
                    f: {
                        g: undefined,
                        h: () => {
                            console.log('Hello');
                        },
                        i: Symbol('test'),
                    },
                },
            })
        ).toBe(
            keyFor({
                a: 1,
                b: {
                    c: {
                        d: 'two',
                        e: null,
                    },
                    f: {},
                },
            })
        );
    });
});
