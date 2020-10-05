import React from 'react'

import {BaseProps, Serializable} from '../types'
import HydrationContext from './HydrationContext'
import HydrationContextType from './HydrationContextType'

type HydrationContextProviderProps<Props extends BaseProps, Hydration extends Serializable> = {
    value: HydrationContextType<Props, Hydration>
    children: React.ReactNode
}

export default function HydrationContextProvider<Props extends BaseProps, Hydration extends Serializable>(
    {value, children}: HydrationContextProviderProps<Props, Hydration>
): JSX.Element {
    const Ctx = HydrationContext as unknown as React.Context<HydrationContextType<Props, Hydration>>

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    )
}
