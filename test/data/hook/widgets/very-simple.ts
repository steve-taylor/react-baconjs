import {widget} from '../../../../src';

import context from '../../context/very-simple-context';
import {stream, initialState, VerySimpleProps, VerySimpleState, VerySimpleMeta} from '../../widget-streams/very-simple';
import component from '../components/very-simple';

export default widget<VerySimpleProps, VerySimpleState, {}, VerySimpleMeta>({
    name: 'very-simple--hooked',
    component,
    context,
    stream,
    initialState,
});
