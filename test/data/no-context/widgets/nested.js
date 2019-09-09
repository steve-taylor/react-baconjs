import {widget} from '../../../../src';

import getData from '../../widget-streams/nested';
import component from '../components/nested';

export default widget({
    name: 'nested--no-context',
    component,
    getData,
});
