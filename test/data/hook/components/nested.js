import React from 'react';
import {useWidgetState} from '../../../../src';

import nestedContext from '../../context/nested-context';
import SimpleWidget from '../widgets/simple';

export default function Nested() {
    const {isLoading, a, b} = useWidgetState(nestedContext);

    return (
        <section>
            {isLoading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <ul>
                    <li>
                        {a}
                    </li>
                    <li>
                        {b}
                    </li>
                    <li>
                        <SimpleWidget power={4} />
                    </li>
                </ul>
            )}
        </section>
    );
}
