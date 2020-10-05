import React from 'react'

import {CompareWidgetState, WidgetContext} from './types'
import useWidgetState from './useWidgetState'

type InjectOptions<STATE> = {
    context: React.Context<WidgetContext<STATE>>
    compare?: CompareWidgetState<STATE>
    children: (state: STATE) => React.ReactNode
}

/**
 * Render via the provided render function when the widget has state.
 *
 * @param context - the widget’s context
 * @param compare - an optional comparison function
 * @param children - the render function
 */
export function Inject<STATE>({
    context,
    compare,
    children,
}: InjectOptions<STATE>): JSX.Element | null {
    const widgetState = useWidgetState<STATE>(context, compare)

    // TypeScript type guards don’t survive array destructuring :(
    return widgetState[1] ? null : children(widgetState[0]) as JSX.Element
}

type LoadingOptions<STATE> = {
    context: React.Context<WidgetContext<STATE>>
    children: () => React.ReactNode
}

/**
 * Render a loading state via the provided render function when the widget is loading.
 *
 * @param context - the widget context
 * @param children - the render function
 */
export function Loading<STATE>({
    context,
    children,
}: LoadingOptions<STATE>): JSX.Element | null {
    const [, isLoading] = useWidgetState<STATE>(context)

    return isLoading ? children() as JSX.Element : null
}
