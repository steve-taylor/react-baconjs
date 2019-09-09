import {widget} from '../../../../src';

import context from '../../context/nested-context';
import getData from '../../widget-streams/nested';
import component from '../components/nested';

export default widget({
    name: 'nested--hooked',
    component,
    context,
    getData,
});
