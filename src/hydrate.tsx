import React from 'react'
import ReactDOM from 'react-dom'

import PhaseContext from './context/PhaseContext'
import HydrationContextProvider from './context/HydrationContextProvider'
import keyFor from './keyFor'
import Phase from './Phase'
import {BaseProps, HydrationSingleWidgetData, Serializable, SerializableObject, WidgetType} from './types'

type HydrateOptions = {
    warnIfNotFound?: boolean
    warnIfAlreadyHydrated?: boolean
}

/**
 * Hydrate all dehydrated instances of the specified widget, returning a <code>Promise</code>.
 *
 * @param widget                          - a widget created with <code>widget</code>
 * @param [options]                       - options (see below)
 * @param [options.warnIfNotFound=false]  - whether or not to warn if the dehydrated widget is not found
 * @param [options.warnIfAlreadyHydrated] - whether or not to warn if the widget has already been hydrated
 */
export default function hydrate<PROPS extends SerializableObject, HYDRATION extends Serializable>(
    widget: WidgetType<PROPS>,
    {
        warnIfNotFound = false,
        warnIfAlreadyHydrated = true,
    }: HydrateOptions = {}
): void {
    /* istanbul ignore next */
    if (typeof window === 'undefined') {
        console.warn('Cannot hydrate a component outside a browser.')

        return
    }

    if (!widget.__widget_name__) {
        console.error('Cannot hydrate a component that isn’t a widget.')

        return
    }

    const {__WIDGET_DATA__: widgetData} = window

    if (!widgetData) {
        if (warnIfNotFound) {
            console.warn('No widgets to hydrate.')
        }

        return
    }

    const {__widget_name__: name} = widget
    const componentHydrations = widgetData[name] as HydrationSingleWidgetData<PROPS, HYDRATION>

    if (!componentHydrations) {
        if (warnIfNotFound) {
            console.warn(`No hydration data found for widget “${name}”.`)
        }

        return
    }

    if (componentHydrations.hydrated) {
        if (warnIfAlreadyHydrated) {
            console.warn(`Widget “${name}” is already hydrated.`)
        }

        return
    }

    for (const [instanceId, instanceHydration] of Object.entries(componentHydrations.instances)) {
        const element = document.getElementById(instanceId)

        if (!element) {
            console.error(`Cannot hydrate widget “${name}” at mount point “#${instanceId}” because the mount point wasn’t found.`)
            continue
        }

        try {
            const {props, hydration} = instanceHydration

            hydrateElement({widget, element, props, hydration})
        } catch (error) {
            console.error(`Widget “${name}” at “#${instanceId}” threw an error while hydrating.`)
            throw error
        }
    }

    componentHydrations.hydrated = true
}

// Hydrate a single element
function hydrateElement<PROPS extends BaseProps, HYDRATION extends Serializable>(
    {
        widget: Widget,
        element,
        props,
        hydration,
    }: {
        widget: WidgetType<PROPS>
        element: HTMLElement
        props: PROPS
        hydration: {[_widgetId: string]: HYDRATION}
    }
) {
    const {__widget_name__: name} = Widget

    // Debugging info
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
        console.info(`Hydrating component “${name}”...`)
    }

    if (hydration) {
        let isHydrating = true

        // If we have initial data, hydrate the server-rendered component
        ReactDOM.hydrate(
            (
                <PhaseContext.Provider value={() => isHydrating ? Phase.hydration : null}>
                    <HydrationContextProvider<PROPS, HYDRATION>
                        value={(name: string, props: PROPS) => (
                            isHydrating
                                ? ({
                                    hydration: hydration[keyFor(name, props)],
                                    elementId: element.id,
                                })
                                : {
                                    hydration: undefined,
                                    elementId: undefined,
                                }
                        )}
                    >
                        <Widget {...(props as never)} />
                    </HydrationContextProvider>
                </PhaseContext.Provider>
            ),
            element,
            () => {
                isHydrating = false
            }
        )
    } else {
        // If we don't have initial data, render over the top of anything currently in the element.
        ReactDOM.render((
            <Widget {...(props as never)} />
        ), element)
    }

    // Debugging info
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
        console.info(`Widget “${name}” hydrated 💦 at`, element)
    }
}
