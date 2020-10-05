import React from 'react'

import {Serializable, SerializableObject} from '../types'
import HydrationContextType from './HydrationContextType'

const defaultHydrationContext: HydrationContextType<SerializableObject, Serializable> = () => {
    throw new Error('<HydrationContext.Provider /> is missing from the current scope.')
}

const HydrationContext = React.createContext<HydrationContextType<SerializableObject, Serializable>>(defaultHydrationContext)

HydrationContext.displayName = 'HydrationContext'

export default HydrationContext
