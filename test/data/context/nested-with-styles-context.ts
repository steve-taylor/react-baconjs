import React from 'react'
import { WidgetContext } from '../../../src'

import {State} from '../widget-streams/nested-with-styles'

export default React.createContext<WidgetContext<State>>(undefined!)
