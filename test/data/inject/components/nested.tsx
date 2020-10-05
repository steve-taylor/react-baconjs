import React from 'react';
import {Inject, Loading} from '../../../../src';

import nestedContext from '../../context/nested-context';
import SimpleWidget from '../widgets/simple';

const Nested = () => (
    <section>
        <Loading context={nestedContext}>
            {() => (
                <div>
                    Loading...
                </div>
            )}
        </Loading>

        <Inject context={nestedContext}>
            {() => (
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
