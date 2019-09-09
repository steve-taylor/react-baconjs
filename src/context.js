import React from 'react';

export const ServerContext = React.createContext(null); // (getStream, registerStream?, onError?)

export const HydrationContext = React.createContext(null); // (name, props) => ({hydration, elementId})

export const PhaseContext = React.createContext(() => null); // () => HYDRATION|SERVER|null

export const HYDRATION = Symbol('hydration');
export const SERVER = Symbol('ssr');

ServerContext.displayName = 'ServerContext';
HydrationContext.displayName = 'HydrationContext';
PhaseContext.displayName = 'PhaseContext';
