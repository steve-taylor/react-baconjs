import React from 'react'

import useWidgetState from './useWidgetState'
import {WidgetContext} from './types'

/**
 * HOC to render a component and optional loading state component with widget state injected.
 *
 * This provides a simple way to decouple React components from widget state. Unlike Redux’s
 * connect, the only supported transformation of state to props is to optionally select a
 * subset of state object properties.
 *
 * Status: Experimental and subject to API change
 *
 * @param context - widget context
 * @param keys    - optional subset of state to use
 */
export default function connect<STATE>(context: React.Context<WidgetContext<STATE>>, keys?: (keyof STATE)[]) {
    // eslint-disable-next-line react/display-name
    return (component: React.ComponentType, loadingComponent: React.ComponentType): JSX.Element | null => (
        <Connector {...{context, compare: keys, component, loadingComponent}} />
    )
}

type Props<STATE> = {
    context: React.Context<WidgetContext<STATE>>
    keys?: (keyof STATE)[]
    component: React.ComponentType
    loadingComponent?: React.ComponentType
}

function Connector<STATE>({
    context,
    keys,
    component: Component,
    loadingComponent: LoadingComponent,
}: Props<STATE>): JSX.Element | null {
    const [state, isLoading] = useWidgetState<STATE>(context, keys)

    return !isLoading ? (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        <Component {...(keys ? keys.reduce((acc, key) => Object.assign(acc, {[key]: state![key]}), {}) : state!)} />
    ) : LoadingComponent ? (
        <LoadingComponent />
    ) : null
}
