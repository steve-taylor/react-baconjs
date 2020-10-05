import {Property} from 'baconjs'
import React from 'react'

export type WidgetContext<STATE> = {
    readonly state$: Property<STATE>
    readonly name: string
    readonly elementId?: string
}

export type CompareWidgetState<STATE> = ((a: STATE, b: STATE) => boolean) | (keyof STATE)[]

export type BaseProps = Pick<SerializableObject, Exclude<keyof SerializableObject, 'ref' | 'key' | 'innerRef' | 'children'>>

export type ReactComponentType<PROPS> = (
    React.ComponentType<PROPS>
    | (React.ForwardRefExoticComponent<React.PropsWithoutRef<PROPS> & React.RefAttributes<unknown>>)
)

export type WidgetType<PROPS extends BaseProps> = ReactComponentType<PROPS> & {
    __widget_name__: string,
}

export type SerializableScalar = string | number | boolean | null

export type SerializableObject = {
    [key: string]: SerializableScalar | SerializableObject | SerializableArray
}

export type SerializableArray = Array<SerializableScalar | SerializableObject | SerializableArray>

export type Serializable = SerializableScalar | SerializableObject | SerializableArray

export interface WidgetData<STATE, HYDRATION extends Serializable = Record<string, Serializable>, META = never> {
    state: STATE
    hydration?: HYDRATION
    meta?: META
}

export type HydrationSingleWidgetData<PROPS extends BaseProps = Record<string, Serializable>, HYDRATION extends Serializable = Serializable> = {
    instances: {
        [mountPointId: string]: {
            props: PROPS
            hydration: {
                [widgetId: string]: HYDRATION
            }
        }
    }
    hydrated?: boolean
}

export type HydrationWidgetData = {
    [widgetName: string]: HydrationSingleWidgetData
}

declare global {
    interface Window {
        __WIDGET_DATA__?: HydrationWidgetData
    }
}
