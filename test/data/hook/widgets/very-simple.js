import {widget} from '../../../../src';

import context from '../../context/very-simple-context';
import getData from '../../widget-streams/very-simple';
import component from '../components/very-simple';

export default widget({
    name: 'very-simple--hooked',
    component,
    context,
    getData,
});
