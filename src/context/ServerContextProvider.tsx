import React from 'react'

import {Serializable} from '../types'
import ServerContext from './ServerContext'
import ServerContextType from './ServerContextType'

type ServerContextProviderProps<STATE, HYDRATION extends Serializable, META> = {
    value: ServerContextType<STATE, HYDRATION, META>
    children: React.ReactNode
}

export default function ServerContextProvider<STATE, HYDRATION extends Serializable, META>(
    {value, children}: ServerContextProviderProps<STATE, HYDRATION, META>
): JSX.Element {
    const Ctx = ServerContext as unknown as React.Context<ServerContextType<STATE, HYDRATION, META>>

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    )
}
