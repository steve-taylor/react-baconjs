import {EventStream} from 'baconjs'
import noop from 'lodash/noop'
import ReactDOM, { unmountComponentAtNode } from 'react-dom'

import keyFor from '../src/keyFor'
import {hydrate} from '../src'

import SimpleWidget1 from './data/hook/widgets/simple'
import NestedWidget1 from './data/hook/widgets/nested'
import VerySimpleWidget1 from './data/hook/widgets/very-simple'
import NestedWithStylesWidget1 from './data/hook/widgets/nested-with-styles'

import SimpleWidget2 from './data/inject/widgets/simple'
import NestedWidget2 from './data/inject/widgets/nested'
import VerySimpleWidget2 from './data/inject/widgets/very-simple'
import NestedWithStylesWidget2 from './data/inject/widgets/nested-with-styles'

import * as fetchBaseValue from './data/streams/fetch-base-value'
import * as fetchV from './data/streams/fetch-v'
import * as fetchW from './data/streams/fetch-w'

type FetchNumberSpy = jest.SpyInstance<EventStream<number>, []> | undefined
type ConsoleSpy = jest.SpyInstance<void, [any?, ...any[]]> | undefined

describe('hydrate(widget, options)', () => {
    describe.each([
        [
            'useWidgetState()',
            '--hooked',
            SimpleWidget1,
            NestedWidget1,
            VerySimpleWidget1,
            NestedWithStylesWidget1,
        ],
        [
            '<Inject />',
            '--injected',
            SimpleWidget2,
            NestedWidget2,
            VerySimpleWidget2,
            NestedWithStylesWidget2,
        ],
    ])('%s', (description, suffix, SimpleWidget, NestedWidget, VerySimpleWidget, NestedWithStylesWidget) => {
        let originalConsoleInfo: typeof console.info | undefined

        beforeEach(() => {
            originalConsoleInfo = console.info
            console.info = () => {} // suppress debugging messages
        })

        afterEach(() => {
            console.info = originalConsoleInfo!
        })

        describe('simple widget', () => {
            let fetchBaseValueSpy: FetchNumberSpy
            const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":{"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`

            beforeEach(() => {
                fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default')
                document.body.innerHTML = html
                eval(document.querySelector('script')!.innerHTML)
                hydrate(SimpleWidget)
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''
                fetchBaseValueSpy!.mockRestore()
            })

            test('does not change DOM', () => {
                expect(document.body.innerHTML).toBe(html)
            })

            test('does not call fetchBaseValue()', () => {
                expect(fetchBaseValueSpy!.mock.calls).toHaveLength(0)
            })

            test('marks all simple widgets as hydrated', () => {
                expect(window.__WIDGET_DATA__![`simple${suffix}`].hydrated).toBe(true)
            })
        })

        describe('nested widget', () => {
            let fetchBaseValueSpy: FetchNumberSpy
            let fetchVSpy: FetchNumberSpy
            let fetchWSpy: FetchNumberSpy
            const html = `<div id="fedcba9876543210"><section><ul><li>27</li><li>72</li><li><section>625</section></li></ul></section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","nested${suffix}","instances","fedcba9876543210"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"coefficient":9},"hydration":{"${keyFor(`nested${suffix}`, {coefficient: 9})}":[3,8],"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`

            beforeEach(() => {
                fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default')
                fetchVSpy = jest.spyOn(fetchV, 'default')
                fetchWSpy = jest.spyOn(fetchW, 'default')
                document.body.innerHTML = html
                eval(document.querySelector('script')!.innerHTML)
                hydrate(NestedWidget)
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('fedcba9876543210')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''
                fetchWSpy!.mockRestore()
                fetchVSpy!.mockRestore()
                fetchBaseValueSpy!.mockRestore()
            })

            test('does not change the DOM', () => {
                expect(document.body.innerHTML).toBe(html)
            })

            test('does not call fetchBaseValue()', () => {
                expect(fetchBaseValueSpy!.mock.calls).toHaveLength(0)
            })

            test('does not call fetchV()', () => {
                expect(fetchVSpy!.mock.calls).toHaveLength(0)
            })

            test('does not call fetchW()', () => {
                expect(fetchWSpy!.mock.calls).toHaveLength(0)
            })
        })

        describe('styled nested widget', () => {
            let fetchBaseValueSpy: FetchNumberSpy
            let fetchVSpy: FetchNumberSpy
            let fetchWSpy: FetchNumberSpy
            const head = '<style data-styled-components="lmVDjZ eNTiKw">/* sc-component-id: StyledSection-semgqu-0 */.lmVDjZ{padding:7px;background:#bbb;}/* sc-component-id: StyledList-semgqu-1 */.eNTiKw{margin:7px;background:#666;color:#ddd;}</style>'
            const body = `<div id="0123456789abcdef"><section class="StyledSection-semgqu-0 lmVDjZ"><ul class="StyledList-semgqu-1 eNTiKw"><li>27</li><li>72</li><li><section>625</section></li></ul></section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","nested-with-styles","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"coefficient":9},"hydration":{"${keyFor(`nested-with-styled${suffix}`, {coefficient: 9})}":[3,8],"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`

            beforeEach(() => {
                fetchBaseValueSpy = jest.spyOn(fetchBaseValue, 'default')
                fetchVSpy = jest.spyOn(fetchV, 'default')
                fetchWSpy = jest.spyOn(fetchW, 'default')
                document.head.innerHTML = head
                document.body.innerHTML = body
                eval(document.querySelector('script')!.innerHTML)
                hydrate(NestedWithStylesWidget)
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''
                document.head.innerHTML = ''
                fetchWSpy!.mockRestore()
                fetchVSpy!.mockRestore()
                fetchBaseValueSpy!.mockRestore()
            })

            test('does not change the head DOM', () => {
                expect(document.head.innerHTML).toBe(head)
            })

            test('does not change the body DOM', () => {
                expect(document.body.innerHTML).toBe(body)
            })

            test('does not call fetchBaseValue()', () => {
                expect(fetchBaseValueSpy!.mock.calls).toHaveLength(0)
            })

            test('does not call fetchV()', () => {
                expect(fetchVSpy!.mock.calls).toHaveLength(0)
            })

            test('does not call fetchW()', () => {
                expect(fetchWSpy!.mock.calls).toHaveLength(0)
            })
        })

        describe('no hydration', () => {
            const html = `<div id="0123456789abcdef"></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","very-simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":null})</script>`

            beforeEach(() => {
                document.body.innerHTML = html
                eval(document.querySelector('script')!.innerHTML)
                hydrate(VerySimpleWidget)
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''
            })

            test('it updates the DOM', () => {
                expect(document.body.innerHTML).toBe(`<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","very-simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":null})</script>`)
            })
        })

        describe('missing __WIDGET_DATA__', () => {
            describe('with warnings', () => {
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    hydrate(VerySimpleWidget, {warnIfNotFound: true})
                })

                afterEach(() => {
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('generates a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(1)
                })

                test('warns that __WIDGET_DATA__ is missing', () => {
                    expect(consoleWarnSpy!.mock.calls[0][0]).toBe('No widgets to hydrate.')
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe('')
                })
            })

            describe('without warnings', () => {
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    hydrate(VerySimpleWidget)
                })

                afterEach(() => {
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('does not generate a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(0)
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe('')
                })
            })
        })

        describe('missing __WIDGET_DATA__ component entry', () => {
            describe('with warnings', () => {
                const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":null})</script>`
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    document.body.innerHTML = html
                    eval(document.querySelector('script')!.innerHTML)
                    hydrate(VerySimpleWidget, {warnIfNotFound: true})
                })

                afterEach(() => {
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('generates a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(1)
                })

                test('warns that __WIDGET_DATA__ component entry is missing', () => {
                    expect(consoleWarnSpy!.mock.calls[0][0]).toBe(`No hydration data found for widget “very-simple${suffix}”.`)
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe(html)
                })
            })

            describe('without warnings', () => {
                const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":null})</script>`
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    document.body.innerHTML = html
                    eval(document.querySelector('script')!.innerHTML)
                    hydrate(VerySimpleWidget)
                })

                afterEach(() => {
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('does not generate a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(0)
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe(html)
                })
            })
        })

        describe('__WIDGET_DATA__ component entry already hydrated', () => {
            describe('with warnings', () => {
                const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":{"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    document.body.innerHTML = html
                    eval(document.querySelector('script')!.innerHTML)
                    window.__WIDGET_DATA__![`simple${suffix}`].hydrated = true
                    hydrate(SimpleWidget)
                })

                afterEach(() => {
                    unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                    delete window.__WIDGET_DATA__
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('generates a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(1)
                })

                test('warns that __WIDGET_DATA__ is already hydrated', () => {
                    expect(consoleWarnSpy!.mock.calls[0][0]).toBe(`Widget “simple${suffix}” is already hydrated.`)
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe(html)
                })
            })

            describe('without warnings', () => {
                const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":{"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`
                let originalConsoleWarn: typeof console.warn | undefined
                let consoleWarnSpy: ConsoleSpy

                beforeEach(() => {
                    originalConsoleWarn = console.warn
                    console.warn = () => {}
                    consoleWarnSpy = jest.spyOn(console, 'warn')
                    document.body.innerHTML = html
                    eval(document.querySelector('script')!.innerHTML)
                    window.__WIDGET_DATA__![`simple${suffix}`].hydrated = true
                    hydrate(SimpleWidget, {warnIfAlreadyHydrated: false})
                })

                afterEach(() => {
                    unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                    delete window.__WIDGET_DATA__
                    document.body.innerHTML = ''
                    consoleWarnSpy!.mockRestore()
                    console.warn = originalConsoleWarn!
                })

                test('does not generates a warning', () => {
                    expect(consoleWarnSpy!.mock.calls).toHaveLength(0)
                })

                test('does not change the DOM', () => {
                    expect(document.body.innerHTML).toBe(html)
                })
            })
        })

        describe('__WIDGET_DATA__ component instance mount point not found', () => {
            const html = `<div id="fedcba9876543210"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":{"${keyFor(`simple${suffix}`, {power: 4})}":{"baseValue":5}}})</script>`
            let originalConsoleError: typeof console.error | undefined
            let consoleErrorSpy: ConsoleSpy

            beforeEach(() => {
                originalConsoleError = console.warn
                console.error = noop
                consoleErrorSpy = jest.spyOn(console, 'error')
                document.body.innerHTML = html
                eval(document.querySelector('script')!.innerHTML)
                hydrate(SimpleWidget)
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('fedcba9876543210')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''
                consoleErrorSpy!.mockRestore()
                console.error = originalConsoleError!
            })

            test('generates an error message', () => {
                expect(consoleErrorSpy!.mock.calls).toHaveLength(1)
            })

            test('generates an error message to say that tne mount point is not found', () => {
                expect(consoleErrorSpy!.mock.calls[0][0]).toBe(`Cannot hydrate widget “simple${suffix}” at mount point “#0123456789abcdef” because the mount point wasn’t found.`)
            })

            test('does not change the DOM', () => {
                expect(document.body.innerHTML).toBe(html)
            })
        })

        describe('hydrate(Element) throws an error', () => {
            const html = `<div id="0123456789abcdef"><section>625</section></div><script type="text/javascript">Object.assign(["__WIDGET_DATA__","simple${suffix}","instances","0123456789abcdef"].reduce(function(a,b){return a[b]=a[b]||{}},window),{"props":{"power":4},"hydration":{"${keyFor(`simple${suffix}`, {power: 4})}":5}})</script>`
            let originalConsoleError: typeof console.error | undefined
            let consoleErrorSpy: ConsoleSpy

            let originalReactDomHydrate: ReactDOM.Renderer
            let error: any

            beforeEach(() => {
                originalConsoleError = console.error
                console.error = noop
                consoleErrorSpy = jest.spyOn(console, 'error')

                originalReactDomHydrate = ReactDOM.hydrate

                Object.assign(ReactDOM, {hydrate: () => {
                        throw new Error('Huzzah!')
                    }})

                document.body.innerHTML = html
                eval(document.querySelector('script')!.innerHTML)
                try {
                    hydrate(SimpleWidget)
                } catch (e) {
                    error = e
                }
            })

            afterEach(() => {
                unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
                delete window.__WIDGET_DATA__
                document.body.innerHTML = ''

                Object.assign(ReactDOM, {hydrate: originalReactDomHydrate})

                consoleErrorSpy!.mockRestore()
                console.error = originalConsoleError!
            })

            test('generates an error message', () => {
                expect(consoleErrorSpy!.mock.calls).toHaveLength(1)
            })

            test('generates an error message to say that an error was thrown', () => {
                expect(consoleErrorSpy!.mock.calls[0][0]).toBe(`Widget “simple${suffix}” at “#0123456789abcdef” threw an error while hydrating.`)
            })

            test('does not change the DOM', () => {
                expect(document.body.innerHTML).toBe(html)
            })

            test('rethrows the error', () => {
                expect((error as Error).message).toBe('Huzzah!')
            })
        })
    });
})
