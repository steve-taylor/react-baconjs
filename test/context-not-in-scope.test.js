import React from 'react';
import ReactDOM from 'react-dom';
import {useWidgetState} from '../src';

const context = React.createContext(null);

function Component() {
    const {foo} = useWidgetState(context);

    return (
        <div>
            {foo}
        </div>
    );
}

describe('Context not in scope', () => {
    let mountElement;
    let originalConsoleError;
    let consoleErrorSpy;

    beforeEach(async () => {
        originalConsoleError = console.error;
        console.error = () => {};
        consoleErrorSpy = jest.spyOn(console, 'error');
        mountElement = document.body.appendChild(document.createElement('div'));
        ReactDOM.render(<Component />, mountElement);
        await new Promise((resolve) => void setTimeout(resolve, 100));
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        console.error = originalConsoleError;
        ReactDOM.unmountComponentAtNode(mountElement);
        document.body.innerHTML = '';
    });

    test('it throws an error', () => {
        expect(consoleErrorSpy.mock.calls.slice(-1)[0][0]).toBe(
            'Cannot use Inject or useWidgetState outside the scope of the specified context\'s widget.'
        );
    });
});
