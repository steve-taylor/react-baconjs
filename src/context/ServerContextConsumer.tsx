import React from 'react'

import {Serializable} from '../types'
import ServerContext from './ServerContext'
import ServerContextType from './ServerContextType'

type ServerContextConsumerProps<State, Hydration extends Serializable, Meta> = {
    children: (value: ServerContextType<State, Hydration, Meta>) => React.ReactNode
}

export default function ServerContextConsumer<State, Hydration extends Serializable, Meta>(
    {children}: ServerContextConsumerProps<State, Hydration, Meta>
): JSX.Element {
    const Ctx = ServerContext as unknown as React.Context<ServerContextType<State, Hydration, Meta>>

    return (
        <Ctx.Consumer>
            {children}
        </Ctx.Consumer>
    )
}
