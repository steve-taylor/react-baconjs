import React from 'react'
import {Inject} from '../../../../src'

import VerySimpleContext from '../../context/very-simple-context'

const VerySimple = React.forwardRef<unknown>((_props, ref) => (
    <section ref={ref as React.Ref<never>}>
        <Inject context={VerySimpleContext}>
            {({x}) => x}
        </Inject>
    </section>
))

VerySimple.displayName = 'VerySimple'

export default VerySimple
