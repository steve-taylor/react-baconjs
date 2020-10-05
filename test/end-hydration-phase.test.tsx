import {combineTemplate, constant} from 'baconjs'
import noop from 'lodash/noop'
import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'

import PhaseContext from '../src/context/PhaseContext'
import Phase from '../src/Phase'

import {hydrate, widget, renderToHtml, WidgetContext} from '../src'

import ErrorBoundary from './util/error-boundary'

jest.mock('uuid', () => ({
    __esModule: true,
    v1: jest.fn(() => '0123456789abcdef'),
}))

const Context = React.createContext<WidgetContext<{}>>(undefined!)

const Component: React.FC<{children?: React.ReactNode}> = ({children}) => (
    <div>
        <h2>Child</h2>
        <div>{children}</div>
        <p id="phase">
            <PhaseContext.Consumer>
                {(getPhase) => {
                    switch (getPhase()) {
                        case Phase.server:
                            return 'SSR'
                        case Phase.hydration:
                            return 'hydration'
                        default:
                            return 'client'
                    }
                }}
            </PhaseContext.Consumer>
        </p>
    </div>
)

const Child = widget({
    name: 'child',
    component: Component,
    context: Context,
    state: () => combineTemplate({state: {}}),
    dehydrate: () => ({}),
    hydrate: () => ({}),
    meta: () => ({}),
})

// Bypass compile-time type checking for this scenario
const ChildComponent: React.FC<{}> = Child as unknown as React.FC<{}>

const Grandchild: React.FC<{}> = () => (
    <div>
        <h3>Grandchild</h3>
    </div>
)

const Parent = widget({
    name: 'parent',
    component: () => {
        const [shouldRenderChild, setShouldRenderChild] = useState(false)

        useEffect(
            () => {
                setShouldRenderChild(true)
            },
            []
        )

        return (
            <ErrorBoundary>
                <div>
                    <h1>Parent</h1>
                    {shouldRenderChild ? (
                        // This will be rendered for the first time *after* hydration, so it *shouldn't* think it's hydrating.
                        // The <Grandchild /> React element isn't serializable and will cause keyFor to throw an error if an attempt is made
                        // to hydrate Child, which will trigger the error boundary.
                        <ChildComponent>
                            <Grandchild />
                        </ChildComponent>
                    ) : null}
                </div>
            </ErrorBoundary>
        )
    },
    context: Context,
    state: () => constant({}),
    dehydrate: () => ({}),
    hydrate: () => ({}),
    meta: () => ({}),
})

// Tests that the hydration phase ends after hydration
describe('End hydration phase', () => {
    let originalConsoleInfo: typeof console.info | undefined
    let originalConsoleError: typeof console.error | undefined

    beforeEach(async () => {
        document.body.innerHTML = await renderToHtml(<Parent />)
        eval(document.querySelector('script')!.innerHTML)
        originalConsoleInfo = console.info
        console.info = () => {}
        hydrate(Parent)
        originalConsoleError = console.error
        console.error = noop
        await new Promise((resolve) => void setTimeout(resolve)) // wait for the component to mount
    })

    afterEach(() => {
        console.info = originalConsoleInfo!
        console.error = originalConsoleError!
        delete window.__WIDGET_DATA__
        ReactDOM.unmountComponentAtNode(document.getElementById('0123456789abcdef')!)
        document.body.innerHTML = ''
    })

    test('it does not try to hydrate the child after hydration has occurred', async () => {
        expect(document.querySelector('#error')).toBe(null)
    })

    test('it does not render the child in the context of the hydration render phase', () => {
        expect(document.querySelector('#phase')!.innerHTML).toBe('client')
    })
})
