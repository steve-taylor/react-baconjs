import React from 'react';
import {Inject} from '../../../../src';

import nestedContext from '../../context/nested-context';
import SimpleWidget from '../widgets/simple';

const Nested = () => (
    <section>
        <Inject context={nestedContext}>
            {({isLoading}) => isLoading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <ul>
                    <Inject context={nestedContext}>
                        {({a}) => (
                            <li>
                                {a}
                            </li>
                        )}
                    </Inject>
                    <Inject context={nestedContext}>
                        {({b}) => (
                            <li>
                                {b}
                            </li>
                        )}
                    </Inject>
                    <li>
                        <SimpleWidget power={4} />
                    </li>
                </ul>
            )}
        </Inject>
    </section>
);

export default Nested;
