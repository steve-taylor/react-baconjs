import {Property} from 'baconjs';
import React from 'react';

import {BaseProps, Serializable, SerializableObject, WidgetData} from './types';

export interface ServerContextType<S, H extends Serializable, M> {
    getStream: (key: string) => Property<WidgetData<S, H, M>>;
    registerStream?: (key: string, stream$: Property<WidgetData<S, H, M>>) => void;
    onMeta?: (meta: M) => void;
    onError?: (error: unknown) => void;
}

const defaultServerContext: ServerContextType<unknown, Serializable, unknown> = {
    getStream: () => {
        throw new Error('<ServerContext.Provider /> is missing from the current scope.');
    },
};

export type HydrationContextType<
    P extends BaseProps,
    H extends Serializable,
> = (name: string, props: P) => {hydration: H | undefined; elementId: string | undefined;};

const defaultHydrationContext: HydrationContextType<SerializableObject, Serializable> = () => {
    throw new Error('<HydrationContext.Provider /> is missing from the current scope.');
}

export const HYDRATION: unique symbol = Symbol('hydration');
export const SERVER = Symbol('ssr');

export type Phase = typeof HYDRATION | typeof SERVER | null;
export type PhaseContextType = () => Phase;

export const ServerContext = React.createContext<ServerContextType<unknown, Serializable, unknown>>(defaultServerContext);

export const HydrationContext = React.createContext<HydrationContextType<SerializableObject, Serializable>>(defaultHydrationContext);

export const PhaseContext = React.createContext<PhaseContextType>(() => null);

ServerContext.displayName = 'ServerContext';
HydrationContext.displayName = 'HydrationContext';
PhaseContext.displayName = 'PhaseContext';

export function ServerContextConsumer<S, H extends Serializable, M>({
    children,
}: {
    children: (value: ServerContextType<S, H, M>) => React.ReactNode,
}): JSX.Element {
    const Ctx = ServerContext as unknown as React.Context<ServerContextType<S, H, M>>;

    return (
        <Ctx.Consumer>
            {children}
        </Ctx.Consumer>
    );
}

export function ServerContextProvider<S, H extends Serializable, M>({
    value,
    children,
}: {
    value: ServerContextType<S, H, M>,
    children: React.ReactNode,
}): JSX.Element {
    const Ctx = ServerContext as unknown as React.Context<ServerContextType<S, H, M>>;

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    );
}

export function HydrationContextConsumer<P extends BaseProps, H extends Serializable>({
    children,
}: {
    children: (value: HydrationContextType<P, H>) => React.ReactNode,
}): JSX.Element {
    const Ctx = HydrationContext as unknown as React.Context<HydrationContextType<P, H>>;

    return (
        <Ctx.Consumer>
            {children}
        </Ctx.Consumer>
    );
}

export function HydrationContextProvider<P extends BaseProps, H extends Serializable>({
    value,
    children,
}: {
    value: HydrationContextType<P, H>,
    children: React.ReactNode,
}): JSX.Element {
    const Ctx = HydrationContext as unknown as React.Context<HydrationContextType<P, H>>;

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    );
}
