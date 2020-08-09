import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {Bus, combineTemplate, Property} from 'baconjs';
import {hydrate, renderToHtml, widget} from '../src';
import { WidgetContext, WidgetData } from '../src/types';

jest.mock('uuid', () => ({
    __esModule: true,
    v1: jest.fn(() => '0123456789abcdef'),
}));

// Tests that changing the ref after hydration doesn't cause the widget HOC to re-mount
describe('Change ref after hydration', () => {
    let mounts = 0;

    type CP = {};
    type CS = {};
    type CH = {};

    const bus = new Bus();

    const Child = widget<CP, CS, CH>({
        name: 'child',
        component: React.forwardRef((_props, ref: React.Ref<HTMLDivElement>) => {
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
        context: React.createContext<WidgetContext<CS>>(undefined!),
        stream: (): Property<WidgetData<CH, CS>> => combineTemplate({
            state: {},
        }),
        initialState: {},
    });

    type PP = {};
    type PS = {};
    type PH = {};

    const Parent = widget<PP, PS, PH>({
        name: 'parent',
        component: () => {
            const [refIndex, setRefIndex] = useState<number>(0);
            const childRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)];

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
        context: React.createContext<WidgetContext<PS>>(undefined!),
        stream: (): Property<WidgetData<PS, PH>> => combineTemplate({state: {}}),
        initialState: {},
    });

    let originalConsoleInfo: typeof console.info | undefined;

    beforeEach(async () => {
        originalConsoleInfo = console.info;
        console.info = () => {}; // suppress debugging messages

        document.body.innerHTML = await renderToHtml(<Parent />);
        eval(document.querySelector('script')!.innerHTML);
        hydrate(Parent);

        // Wait until component updates are complete
        await bus.firstToPromise();
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(document.getElementById('0123456789abcdef')!);
        delete window.__WIDGET_DATA__;
        document.body.innerHTML = '';
        mounts = 0;
        console.info = originalConsoleInfo!;
    });

    test('it mounts only once', () => {
        expect(mounts).toBe(1);
    });
});
