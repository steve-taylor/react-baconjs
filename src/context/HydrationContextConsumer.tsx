import React from 'react'

import {BaseProps, Serializable} from '../types'
import HydrationContext from './HydrationContext'
import HydrationContextType from './HydrationContextType'

type HydrationContextConsumerProps<Props extends BaseProps, Hydration extends Serializable> = {
    children: (value: HydrationContextType<Props, Hydration>) => React.ReactNode
}

export default function HydrationContextConsumer<Props extends BaseProps, Hydration extends Serializable>(
    {children}: HydrationContextConsumerProps<Props, Hydration>
): JSX.Element {
    const Ctx = HydrationContext as unknown as React.Context<HydrationContextType<Props, Hydration>>

    return (
        <Ctx.Consumer>
            {children}
        </Ctx.Consumer>
    )
}
