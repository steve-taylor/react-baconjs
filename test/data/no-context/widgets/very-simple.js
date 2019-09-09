import {widget} from '../../../../src';

import getData from '../../widget-streams/very-simple';
import component from '../components/very-simple';

export default widget({
    name: 'very-simple--no-context',
    component,
    getData,
});
