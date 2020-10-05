import {Bus, constant, Property} from 'baconjs'
import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom'
import {hydrate, renderToHtml, widget, WidgetContext} from '../src'

jest.mock('uuid', () => ({
    __esModule: true,
    v1: jest.fn(() => '0123456789abcdef'),
}))

// Tests that changing the ref after hydration doesn't cause the widget HOC to re-mount
describe('Change ref after hydration', () => {
    let mounts = 0

    type CP = {}
    type CS = {}
    type CH = {}
    type CM = {}

    const bus = new Bus()

    const Child = widget<CP, CS, CH, CM>({
        name: 'child',
        component: React.forwardRef((_props, ref: React.Ref<HTMLDivElement>) => {
            useEffect(
                () => {
                    ++mounts
                },
                []
            )

            return (
                <div ref={ref}>
                    Child
                </div>
            )
        }),
        context: React.createContext<WidgetContext<CS>>(undefined!),
        state: (): Property<CS> => constant({}),
        dehydrate: () => ({}),
        hydrate: () => ({}),
        meta: () => ({}),
    })

    type PP = {}
    type PS = {}
    type PH = {}
    type PM = {}

    const Parent = widget<PP, PS, PH, PM>({
        name: 'parent',
        component: () => {
            const [refIndex, setRefIndex] = useState<number>(0)
            const childRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)]

            // Make this component, and therefore the child, re-render.
            useEffect(
                () => {
                    setRefIndex(1)
                },
                []
            )

            // Notify readiness to test
            useEffect(
                () => {
                    if (refIndex === 1) {
                        bus.push(null)
                    }
                },
                [refIndex]
            )

            return (
                <div>
                    <Child ref={childRefs[refIndex]} />
                </div>
            )
        },
        context: React.createContext<WidgetContext<PS>>(undefined!),
        state: (): Property<PS> => constant({}),
        dehydrate: () => ({}),
        hydrate: () => ({}),
        meta: () => ({}),
    })

    let originalConsoleInfo: typeof console.info | undefined

    beforeEach(async () => {
        originalConsoleInfo = console.info
        console.info = () => {} // suppress debugging messages

        document.body.innerHTML = await renderToHtml(<Parent />)
        eval(document.querySelector('script')!.innerHTML)
        hydrate(Parent)

        // Wait until component updates are complete
        await bus.firstToPromise()
    })

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
        delete window.__WIDGET_DATA__
        document.body.innerHTML = ''
        mounts = 0
        console.info = originalConsoleInfo!
    })

    test('it mounts only once', () => {
        expect(mounts).toBe(1)
    })
})
