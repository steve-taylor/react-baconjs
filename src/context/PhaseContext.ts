import React from 'react'

import PhaseContextType from './PhaseContextType'

const PhaseContext = React.createContext<PhaseContextType>(() => null)

PhaseContext.displayName = 'PhaseContext'

export default PhaseContext
