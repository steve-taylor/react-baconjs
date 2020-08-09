import noop from 'lodash/noop';
import React from 'react';
import ReactDOM from 'react-dom';
import {useWidgetState} from '../src';
import { WidgetContext } from '../src/types';

type S = {
    foo: string;
};

const context = React.createContext<WidgetContext<S>>(undefined!);

function Component() {
    const {foo} = useWidgetState<S>(context) as any;

    return (
        <div>
            {foo}
        </div>
    );
}

describe('Context not in scope', () => {
    let mountElement: HTMLDivElement | undefined;
    let originalConsoleError: typeof console.error | undefined;
    let error: unknown;

    beforeEach(async () => {
        console.error = noop; // suppress console.error output
        mountElement = document.body.appendChild(document.createElement('div'));

        try {
            ReactDOM.render(<Component />, mountElement);
        } catch (e) {
            error = e;
        }

        await new Promise<void>((resolve) => void setTimeout(resolve, 100));
    });

    afterEach(() => {
        console.error = originalConsoleError!;
        ReactDOM.unmountComponentAtNode(mountElement!);
        document.body.innerHTML = '';
    });

    test('it throws the expected error', () => {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
            'Cannot use Inject or useWidgetState outside the scope of the specified context’s widget.'
        );
    });
});
