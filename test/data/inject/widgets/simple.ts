import {widget} from '../../../../src'

import context from '../../context/simple-context'
import {dehydrate, hydrate, meta, state} from '../../widget-streams/simple'
import component from '../components/simple'

export default widget({
    name: 'simple--injected',
    context,
    component,
    state,
    dehydrate,
    hydrate,
    meta,
})
