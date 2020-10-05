import React from 'react'

import {Serializable} from '../types'
import ServerContext from './ServerContext'
import ServerContextType from './ServerContextType'

type ServerContextProviderProps<State, Hydration extends Serializable, Meta> = {
    value: ServerContextType<State, Hydration, Meta>
    children: React.ReactNode
}

export default function ServerContextProvider<State, Hydration extends Serializable, Meta>(
    {value, children}: ServerContextProviderProps<State, Hydration, Meta>
): JSX.Element {
    const Ctx = ServerContext as unknown as React.Context<ServerContextType<State, Hydration, Meta>>

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    )
}
