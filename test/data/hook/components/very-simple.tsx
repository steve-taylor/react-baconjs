import React from 'react';
import {useWidgetState} from '../../../../src';

import VerySimpleContext from '../../context/very-simple-context';

const VerySimple = React.forwardRef<unknown>((_props, ref) => {
    const {x} = useWidgetState(VerySimpleContext)!;

    return (
        <section ref={ref as React.Ref<never>}>
            {x}
        </section>
    );
});

VerySimple.displayName = 'VerySimple';

export default VerySimple;
