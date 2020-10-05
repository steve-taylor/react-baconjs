import {widget} from '../../../../src'

import context from '../../context/nested-with-styles-context'
import {dehydrate, hydrate, meta, state} from '../../widget-streams/nested-with-styles'
import component from '../components/nested-with-styles'

export default widget({
    name: 'nested-with-styles--injected',
    context,
    component,
    state,
    dehydrate,
    hydrate,
    meta,
})
