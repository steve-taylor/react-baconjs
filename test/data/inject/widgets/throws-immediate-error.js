import {widget} from '../../../../src';

import context from '../../context/throws-error-context';
import getData from '../../widget-streams/throws-immediate-error';
import component from '../components/throws-error';

export default widget({
    name: 'throws-immediate-error--injected',
    component,
    context,
    getData,
});
