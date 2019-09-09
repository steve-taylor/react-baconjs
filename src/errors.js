export const SSR_TIMEOUT_ERROR = Symbol('timeout');

export function noImmediateStateOnServerError(name) {
    return `An unexpected error occurred while server-side rendering '${name || '(unknown)'}'`;
}

export function noImmediateStateOnHydrationError(name, elementId) {
    return (
        `Cannot hydrate widget "${name}" at DOM node "#${elementId}" because the Observable`
        + ' returned by its getData(props$, hydration, immediate) function does not produce an event immediately upon subscription.'
        + ' To avoid this error, ensure getData(props$, hydration, immediate) returns a Bacon.js Property which produces an event'
        + ' immediately when the hydration object is provided.'
    );
}

export function noImmediateStateOnRenderError(name) {
    return (
        `Widget "${name}" is being rendered client-side, but the Observable returned by its`
        + ' getData(prop$s, hydration, immediate) function does not produce an event immediately upon subscription. To avoid this'
        + ' error, ensure getData(props$, hydration, immediate) returns a Bacon.js Property which produces an event immediately.'
    );
}

export function noContext() {
    return (
        'Cannot use Inject or useWidgetState outside the scope of the specified context\'s widget.'
    );
}
