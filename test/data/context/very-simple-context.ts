import React from 'react';
import { WidgetContext } from '../../../src/types';

import { VerySimpleState } from '../widget-streams/very-simple';

export default React.createContext<WidgetContext<VerySimpleState>>(undefined!);