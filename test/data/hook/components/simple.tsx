import React from 'react';
import {useWidgetState} from '../../../../src';

import SimpleContext from '../../context/simple-context';

export default function Simple() {
    const state = useWidgetState<{x?: number}>(SimpleContext)!;

    return (
        <section>
            {state?.x}
        </section>
    );
}
