import {Property} from 'baconjs';
import React from 'react';

export interface WidgetContext<S> {
    readonly state$: Property<S>;
    readonly name: string;
    readonly elementId?: string;
}

export type CompareWidgetState<T> = ((a: T, b: T) => boolean) | (keyof T)[];

export type BaseProps = Pick<SerializableObject, Exclude<keyof SerializableObject, 'ref' | 'key' | 'innerRef' | 'children'>>;

export type ReactComponentType<P> = (
    React.ComponentType<P>
    | (React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<unknown>>)
);

export type WidgetType<P extends BaseProps> = ReactComponentType<P> & {
    __widget_name__: string,
};

export type SerializableScalar = string | number | boolean | null;

export type SerializableObject = {
    [key: string]: SerializableScalar | SerializableObject | SerializableArray;
}

export type SerializableArray = Array<SerializableScalar | SerializableObject | SerializableArray>;

export type Serializable = SerializableScalar | SerializableObject | SerializableArray;

export interface WidgetData<S, H extends Serializable = Record<string, Serializable>, M = never> {
    state: S;
    hydration?: H;
    meta?: M;
}

export interface HydrationSingleWidgetData<P extends BaseProps = Record<string, Serializable>, H extends Serializable = Serializable> {
    instances: {
        [mountPointId: string]: {
            props: P;
            hydration: {
                [widgetId: string]: H;
            };
        };
    };
    hydrated?: boolean;
}

export interface HydrationWidgetData {
    [widgetName: string]: HydrationSingleWidgetData;
}

declare global {
    interface Window {
        __WIDGET_DATA__: HydrationWidgetData;
    }
}
