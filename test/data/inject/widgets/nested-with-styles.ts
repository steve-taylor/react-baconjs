import {widget} from '../../../../src';

import context from '../../context/nested-with-styles-context';
import {stream, initialState} from '../../widget-streams/nested-with-styles';
import component from '../components/nested-with-styles';

export default widget({
    name: 'nested-with-styles--injected',
    component,
    context,
    stream,
    initialState,
});
