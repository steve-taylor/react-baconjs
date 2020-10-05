import React from 'react'

import {Serializable} from '../types'
import ServerContextType from './ServerContextType'

const defaultServerContext: ServerContextType<unknown, Serializable, unknown> = {
    getStream: () => {
        throw new Error('<ServerContext.Provider /> is missing from the current scope.')
    },
}

const ServerContext = React.createContext<ServerContextType<unknown, Serializable, unknown>>(defaultServerContext)

ServerContext.displayName = 'ServerContext'

export default ServerContext
