import {widget} from '../../../../src';

import context from '../../context/very-simple-context'
import {dehydrate, hydrate, meta, state} from '../../widget-streams/very-simple';
import component from '../components/very-simple';

export default widget({
    name: 'very-simple--hooked',
    context,
    component,
    state,
    dehydrate,
    hydrate,
    meta,
})
