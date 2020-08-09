import React from 'react';
import { WidgetContext } from '../../../src';

import { State } from '../widget-streams/simple';

export default React.createContext<WidgetContext<State>>(undefined!);
