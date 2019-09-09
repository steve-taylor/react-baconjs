import React from 'react';
import {Inject} from '../../../../src';

import VerySimpleContext from '../../context/very-simple-context';

export default React.forwardRef((props, ref) => (
    <section ref={ref}>
        <Inject context={VerySimpleContext}>
            {({x}) => x}
        </Inject>
    </section>
));
