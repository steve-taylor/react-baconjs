import {widget} from '../../../../src';

import context from '../../context/simple-context';
import {stream, initialState} from '../../widget-streams/simple';
import component from '../components/simple';

export default widget({
    name: 'simple--injected',
    component,
    context,
    stream,
    initialState,
});
