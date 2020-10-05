import keyFor from '../src/keyFor'
import {SerializableObject} from '../src'

describe('keyFor', () => {
    test('it disregards property order', () => {
        expect(keyFor('name', {a: 1, b: 'two', c: null})).toBe(keyFor('name', {c: null, a: 1, b: 'two'}))
    })

    test('it disregards undefined values', () => {
        expect(keyFor('name', {a: 1, b: undefined as unknown as null})).toBe(keyFor('name', {a: 1}))
    })

    test('it disregards functions', () => {
        expect(keyFor('name', {a: 1, b: (() => { console.log('Hello') }) as unknown as SerializableObject})).toBe(keyFor('name', {a: 1}))
    })

    test('it disregards symbols', () => {
        expect(keyFor('name', {a: 1, b: Symbol('test') as unknown as SerializableObject})).toBe(keyFor('name', {a: 1}))
    })

    test('it disregards property order, undefined, function and symbols deeply', () => {
        expect(
            keyFor('name', {
                a: 1,
                b: {
                    c: {
                        d: 'two',
                        e: null,
                    },
                    f: {
                        g: undefined,
                        h: () => {
                            console.log('Hello')
                        },
                        i: Symbol('test'),
                    },
                } as unknown as SerializableObject,
            })
        ).toBe(
            keyFor('name', {
                a: 1,
                b: {
                    c: {
                        d: 'two',
                        e: null,
                    },
                    f: {},
                },
            })
        )
    })
})
