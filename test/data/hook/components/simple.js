import React from 'react';
import {useWidgetState} from '../../../../src';

import SimpleContext from '../../context/simple-context';

export default function Simple() {
    const state = useWidgetState(SimpleContext);

    return (
        <section>
            {!!state && state.x}
        </section>
    );
}
