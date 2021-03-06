import {widget} from '../../../../src';

import context from '../../context/throws-error-context';
import getData from '../../widget-streams/throws-delayed-error';
import component from '../components/throws-error';

export default widget({
    name: 'throws-delayed-error--injected',
    component,
    context,
    getData,
});
