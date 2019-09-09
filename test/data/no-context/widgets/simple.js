import {widget} from '../../../../src';

import getData from '../../widget-streams/simple';
import component from '../components/simple';

export default widget({
    name: 'simple--no-context',
    component,
    getData,
});
