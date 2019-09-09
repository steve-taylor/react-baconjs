import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {Bus, combineTemplate} from 'baconjs';
import {hydrate, renderToHtml, widget} from '../src';

jest.mock('uuid/v1');
require('uuid/v1').mockImplementation(() => '0123456789abcdef');

// Tests that changing the ref after hydration doesn't cause the widget HOC to re-mount
describe('Change ref after hydration', () => {
    let mounts = 0;

    const bus = new Bus();

    const Child = widget({
        name: 'child',
        component: React.forwardRef((props, ref) => {
            useEffect(
                () => {
                    ++mounts;
                },
                []
            );

            return (
                <div ref={ref}>
                    Child
                </div>
            );
        }),
        getData: (props$) => props$.map((state) => ({state})), // generate new state every time props change
    });

    const Parent = widget({
        name: 'parent',
        component: () => {
            const [refIndex, setRefIndex] = useState(0);
            const childRefs = [useRef(null), useRef(null)];

            // Make this component, and therefore the child, re-render.
            useEffect(
                () => {
                    setRefIndex(1);
                },
                []
            );

            // Notify readiness to test
            useEffect(
                () => {
                    if (refIndex === 1) {
                        bus.push(null);
                    }
                },
                [refIndex]
            );

            return (
                <div>
                    <Child ref={childRefs[refIndex]} />
                </div>
            );
        },
        getData: (props$) => combineTemplate({
            state: {
                shouldInitiallyRenderChild: props$.map(({shouldInitiallyRenderChild}) => shouldInitiallyRenderChild),
            },
        }),
    });

    let originalConsoleInfo;

    beforeEach(async () => {
        originalConsoleInfo = console.info;
        console.info = () => {}; // suppress debugging messages

        document.body.appendChild(document.createElement('div'));
        document.body.innerHTML = await renderToHtml(<Parent />);
        eval(document.querySelector('script').innerHTML);
        hydrate(Parent);

        // Wait until component updates are complete
        await bus.firstToPromise();
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('0123456789abcdef'));
        delete window.__WIDGET_DATA__;
        document.body.innerHTML = '';
        mounts = 0;
        console.info = originalConsoleInfo;
    });

    test('it mounts only once', () => {
        expect(mounts).toBe(1);
    });
});
