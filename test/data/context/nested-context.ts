import React from 'react';
import { WidgetContext } from '../../../src';

import { State } from '../widget-streams/nested';

export default React.createContext<WidgetContext<State>>(undefined!);
