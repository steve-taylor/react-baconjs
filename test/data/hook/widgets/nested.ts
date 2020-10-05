import {widget} from '../../../../src'

import context from '../../context/nested-context'
import {dehydrate, hydrate, meta, state} from '../../widget-streams/nested'
import component from '../components/nested'

export default widget({
    name: 'nested--hooked',
    context,
    component,
    state,
    dehydrate,
    hydrate,
    meta,
})
