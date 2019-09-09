import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {combineTemplate, constant} from 'baconjs';

import {PhaseContext, HYDRATION, SERVER} from '../src/context';
import {hydrate, widget, renderToHtml} from '../src';

import ErrorBoundary from './util/error-boundary';

jest.mock('uuid/v1');
require('uuid/v1').mockImplementation(() => '0123456789abcdef');

const Child = widget({
    name: 'child',
    getData: (props$) => combineTemplate({state: {children: props$.map(({children}) => children)}}),
    component: ({children}) => (
        <div>
            <h2>Child</h2>
            <div>{children}</div>
            <p id="phase">
                <PhaseContext.Consumer>
                    {(getPhase) => {
                        switch (getPhase()) {
                            case SERVER:
                                return 'SSR';
                            case HYDRATION:
                                return 'hydration';
                            default:
                                return 'client';
                        }
                    }}
                </PhaseContext.Consumer>
            </p>
        </div>
    ),
});

const Grandchild = () => (
    <div>
        <h3>Grandchild</h3>
    </div>
);

const Parent = widget({
    name: 'parent',
    getData: () => constant({state: {}, hydration: {}}),
    component: () => {
        const [shouldRenderChild, setShouldRenderChild] = useState(false);

        useEffect(
            () => {
                setShouldRenderChild(true);
            },
            []
        );

        return (
            <ErrorBoundary>
                <div>
                    <h1>Parent</h1>
                    {shouldRenderChild ? (
                        // This will be rendered for the first time *after* hydration, so it *shouldn't* think it's hydrating.
                        // The <Grandchild /> React element isn't serializable and will cause keyFor to throw an error if an attempt is made
                        // to hydrate Child, which will trigger the error boundary.
                        <Child>
                            <Grandchild />
                        </Child>
                    ) : null}
                </div>
            </ErrorBoundary>
        );
    },
});

// Tests that the hydration phase ends after hydration
describe('End hydration phase', () => {
    let originalConsoleInfo;
    let originalConsoleError;

    beforeEach(async () => {
        document.body.innerHTML = await renderToHtml(<Parent />);
        eval(document.querySelector('script').innerHTML);
        originalConsoleInfo = console.info;
        console.info = () => {};
        hydrate(Parent);
        originalConsoleError = console.error;
        console.error = () => {};
        await new Promise((resolve) => void setTimeout(resolve)); // wait for the component to mount
    });

    afterEach(() => {
        console.info = originalConsoleInfo;
        console.error = originalConsoleError;
        delete window.__WIDGET_DATA__;
        ReactDOM.unmountComponentAtNode(document.getElementById('0123456789abcdef'));
        document.body.innerHTML = '';
    });

    test('it does not try to hydrate the child after hydration has occurred', async () => {
        expect(document.querySelector('#error')).toBe(null);
    });

    test('it does not render the child in the context of the hydration render phase', () => {
        expect(document.querySelector('#phase').innerHTML).toBe('client');
    });
});
