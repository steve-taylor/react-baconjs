import {widget} from '../../../../src';

import context from '../../context/nested-context';
import {stream, initialState} from '../../widget-streams/nested';
import component from '../components/nested';

export default widget({
    name: 'nested--hooked',
    component,
    context,
    stream,
    initialState,
});
