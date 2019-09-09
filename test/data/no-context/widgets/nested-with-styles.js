import {widget} from '../../../../src';

import getData from '../../widget-streams/nested-with-styles';
import component from '../components/nested-with-styles';

export default widget({
    name: 'nested-with-styles--no-context',
    component,
    getData,
});
