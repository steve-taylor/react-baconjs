/// <reference path="global.d.ts" />

import {EventStream} from 'baconjs'
import noop from 'lodash/noop'
import React from 'react'
import {__DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS} from 'styled-components'
import {renderToHtml, StyledComponentsServerRenderer} from '../src'

import SimpleWidget1 from './data/hook/widgets/simple'
import NestedWidget1 from './data/hook/widgets/nested'
import NestedWithStylesWidget1 from './data/hook/widgets/nested-with-styles'

import SimpleWidget2 from './data/inject/widgets/simple'
import NestedWidget2 from './data/inject/widgets/nested'
import NestedWithStylesWidget2 from './data/inject/widgets/nested-with-styles'

import ThrowsDelayedErrorWidget from './data/inject/widgets/throws-delayed-error'
import ThrowsImmediateErrorWidget from './data/inject/widgets/throws-immediate-error'

import * as fetchBaseValue from './data/streams/fetch-base-value'
import * as fetchV from './data/streams/fetch-v'
import * as fetchW from './data/streams/fetch-w'

jest.mock('uuid', () => ({
    __esModule: true,
    v1: jest.fn(() => '0123456789abcdef'),
}))

const {StyleSheet} = __DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS // I ain't afraid of no ghosts

type FetchNumberSpy = jest.SpyInstance<EventStream<number>, []> | undefined

describe('renderToHtml(widget)', () => {
    [
        {
            name: 'useWidgetState()',
            SimpleWidget: SimpleWidget1,
            NestedWidget: NestedWidget1,
            NestedWithStylesWidget: NestedWithStylesWidget1,
        },
        {
            name: '<Inject />',
            SimpleWidget: SimpleWidget2,
            NestedWidget: NestedWidget2,
            NestedWithStylesWidget: NestedWithStylesWidget2,
        },
    ].forEach(({
        name,
        SimpleWidget,
        NestedWidget,
        NestedWithStylesWidget,
    }) => {
        describe(name, () => {
            describe('simple widget', () => {
                let fetchBaseValueSpy: FetchNumberSpy
                let body: string | undefined

                beforeEach(() => {
                    fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default')
                })

                afterEach(() => {
                    body = undefined
                    fetchBaseValueSpy!.mockRestore()
                })

                describe('with mount point className', () => {
                    beforeEach(async () => {
                        body = await renderToHtml(<SimpleWidget power={4} />, {className: 'mount-point'})
                    })

                    test('renders correctly', () => {
                        expect({body}).toMatchSnapshot()
                    })

                    test('calls fetchBaseValue() once', () => {
                        expect(fetchBaseValueSpy!.mock.calls).toHaveLength(1)
                    })
                })

                describe('without mount point className', () => {
                    beforeEach(async () => {
                        body = await renderToHtml(<SimpleWidget power={4} />)
                    })

                    test('renders correctly', () => {
                        expect({body}).toMatchSnapshot()
                    })

                    test('calls fetchBaseValue() once', () => {
                        expect(fetchBaseValueSpy!.mock.calls).toHaveLength(1)
                    })
                })
            })

            describe('nested widget', () => {
                let fetchBaseValueSpy: FetchNumberSpy
                let fetchVSpy: FetchNumberSpy
                let fetchWSpy: FetchNumberSpy
                let body: string | undefined

                beforeEach(async () => {
                    fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default')
                    fetchVSpy = jest.spyOn(fetchV, 'default')
                    fetchWSpy = jest.spyOn(fetchW, 'default')
                    body = await renderToHtml(<NestedWidget coefficient={9} />)
                })

                afterEach(() => {
                    body = undefined
                    fetchWSpy!.mockRestore()
                    fetchVSpy!.mockRestore()
                    fetchBaseValueSpy!.mockRestore()
                })

                test('renders correctly', () => {
                    expect({body}).toMatchSnapshot()
                })

                test('calls fetchBaseValue() once', () => {
                    expect(fetchBaseValueSpy!.mock.calls).toHaveLength(1)
                })

                test('calls fetchVSpy() once', () => {
                    expect(fetchVSpy!.mock.calls).toHaveLength(1)
                })

                test('calls fetchWSpy() once', () => {
                    expect(fetchWSpy!.mock.calls).toHaveLength(1)
                })
            })

            describe('styled nested widget', () => {
                beforeEach(() => {
                    // Pretend we're on a server
                    StyleSheet.reset(true)
                })

                afterEach(() => {
                    // Stop pretending
                    StyleSheet.reset()
                })

                test('renders correctly', async () => {
                    const renderer = new StyledComponentsServerRenderer()
                    const body = await renderToHtml(
                        <NestedWithStylesWidget coefficient={9} />,
                        {render: renderer.render}
                    )
                    const head = renderer.getStyleTags()

                    expect({head, body}).toMatchSnapshot()
                })
            })

            describe('regular component', () => {
                describe('with mount point className', () => {
                    test('renders as a regular element', async () => {
                        expect({body: await renderToHtml(<div>Hello 🙂</div>)}).toMatchSnapshot()
                    })
                })

                describe('without mount point className', () => {
                    test('renders as a regular element', async () => {
                        expect({body: await renderToHtml(<div>Hello 🙂</div>, {className: 'mount-point'})}).toMatchSnapshot()
                    })
                })
            })
        })
    })

    describe('stream(props$, hydration?) Observable produces an immediate error', () => {
        let originalConsoleError: typeof console.error | undefined
        let error: string | undefined

        beforeEach(async () => {
            originalConsoleError = console.error
            console.error = noop

            return renderToHtml(<ThrowsImmediateErrorWidget />).catch((e) => {
                error = e as string
            })
        })

        afterEach(() => {
            console.error = originalConsoleError!
        })

        test('propagates the error to the caller', () => {
            expect(error).toBe('Nope!')
        })
    })

    describe('stream(props$, hydration?) Observable produces a delayed error', () => {
        let originalConsoleError: typeof console.error | undefined
        let error: string | undefined

        beforeEach(async () => {
            originalConsoleError = console.error
            console.error = noop

            return renderToHtml(<ThrowsDelayedErrorWidget />).catch((e) => {
                error = e as string
            })
        })

        afterEach(() => {
            console.error = originalConsoleError!
        })

        test('propagates the error to the caller', () => {
            expect(error).toBe('Nope!')
        })
    })

    // Needs more tests
    describe('onMeta', () => {
        let accumulatedData: object = {}

        afterEach(() => {
            accumulatedData = {}
        })

        describe('child overrides parent; last sibling wins', () => {
            beforeEach(() => {
                return renderToHtml(
                    <NestedWidget1 coefficient={9} />,
                    {
                        onMeta(data) {
                            Object.assign(accumulatedData, data)
                        },
                    }
                )
            })

            test('accumulates the expected data', () => {
                expect(accumulatedData).toMatchSnapshot()
            })
        })

        describe('parent overrides child; first sibling wins', () => {
            beforeEach(() => {
                return renderToHtml(
                    <NestedWidget1 coefficient={9} />,
                    {
                        onMeta(meta: {maxAge: number}) {
                            accumulatedData = {
                                ...meta,
                                ...accumulatedData,
                            }
                        },
                    }
                )
            })

            test('accumulates the expected data', () => {
                expect(accumulatedData).toMatchSnapshot()
            })
        })
    })
})
