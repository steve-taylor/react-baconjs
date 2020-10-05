import React from 'react'
import {Inject} from '../../../../src'

import SimpleContext from '../../context/simple-context'

const Simple = () => (
    <section>
        <Inject context={SimpleContext}>
            {({x}) => x ?? null}
        </Inject>
    </section>
)

export default Simple
