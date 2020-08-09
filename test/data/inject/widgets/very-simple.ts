import {widget} from '../../../../src';

import context from '../../context/very-simple-context';
import {stream, initialState} from '../../widget-streams/very-simple';
import component from '../components/very-simple';

export default widget({
    name: 'very-simple--injected',
    component,
    context,
    stream,
    initialState,
});
