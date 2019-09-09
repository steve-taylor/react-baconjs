import React from 'react';
import {useWidgetState} from '../../../../src';

import VerySimpleContext from '../../context/very-simple-context';

export default React.forwardRef(function VerySimple(props, ref) {
    const {x} = useWidgetState(VerySimpleContext);

    return (
        <section ref={ref}>
            {x}
        </section>
    );
});
