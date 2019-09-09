import React, {useLayoutEffect, useState} from 'react';
import ReactDOM from 'react-dom';

import VerySimpleWidget1 from './data/hook/widgets/very-simple';
import VerySimpleWidget2 from './data/inject/widgets/very-simple';
import VerySimpleWidget3 from './data/no-context/widgets/very-simple';

describe('Widget props change', () => {
    let mountElement;

    beforeEach(() => {
        mountElement = document.body.appendChild(document.createElement('div'));
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(mountElement);
        document.body.removeChild(mountElement);
    });

    [
        {
            name: 'useWidgetState()',
            VerySimpleWidget: VerySimpleWidget1,
        },
        {
            name: '<Inject />',
            VerySimpleWidget: VerySimpleWidget2,
        },
        {
            name: 'No context',
            VerySimpleWidget: VerySimpleWidget3,
        },
    ].forEach(({name, VerySimpleWidget}) => {
        describe(name, () => {
            beforeEach(() => {
                function Component() {
                    const [power, setPower] = useState(1); // with initial state, should render <section>5</section>

                    useLayoutEffect(() => {
                        setPower(2); // with updated state, should render <section>25</section>
                    }, []);

                    return (
                        <VerySimpleWidget power={power} />
                    );
                }

                ReactDOM.render(<Component />, mountElement);
            });

            test('it updates UI', () => {
                expect(mountElement.querySelector('section').innerHTML).toBe('25');
            });
        });
    });
});
