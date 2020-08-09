import {Property, Sink, Unsub} from 'baconjs';
import React, {useContext, useEffect, useRef, useState} from 'react';

import {PhaseContext, SERVER, Phase, PhaseContextType} from './context';
import {noContext, noImmediateStateOnServerError} from './errors';
import {CompareWidgetState, WidgetContext} from './types';

/**
 * <code>useWidgetState</code> is a React hook that provides a widget's state
 * within a React component parented by the widget.
 *
 * Widgets can be nested, so the widget whose state is required is specified by
 * its React context.
 *
 * If the component is not inside the widget, an error will be logged and an
 * empty object returned.
 *
 * If the widget doesn't immediately (and synchronously) produce a value on the
 * first client-side render, an error will be logged and an empty object
 * returned.
 *
 * To avoid unnecessary re-renders, provide a comparison function that returns
 * <code>true</code> if, and only if, its first two arguments are equal.
 * Alternatively, provide an array of the names of the properties to shallow-
 * compare between two consecutive widget states.
 *
 * @example
 *
 * // Get foo and bar from someWidget's state and re-render this component when
 * // foo and/or bar changes, based on === comparison.
 * const {foo, bar} = useWidgetState(someWidgetContext, ['foo', 'bar']);
 *
 * @example
 *
 * // As above, but doing it the hard way.
 * const {foo, bar} = useWidgetState(
 *     someWidgetContext,
 *     (a, b) => a.foo === b.foo && a.bar === b.bar
 * );
 *
 * @param context - a widget's context
 * @param [compare] - the widget state comparison or list of its properties to compare
 * @returns the widget's state.
 */
export default function useWidgetState<S>(
    context: React.Context<WidgetContext<S>>,
    compare?: CompareWidgetState<S>
): S {
    const phase: Phase = useContext<PhaseContextType>(PhaseContext)();

    if (phase === SERVER) {
        const {state$, name} = useContext<WidgetContext<S>>(context);
        const [state] = useState<S>(() => {
            let immediateState: S | undefined;

            // Subscribe and unsubscribe to get an immediate value from the stream.
            // If we're *really* server-side, state$ is generated by bacon.constant from the initial value produced by
            // stream when it eventually resolves, so this should *always* produce initial state.
            // Therefore, this should *absolutely* not happen.
            state$.onValue((value: S) => {
                immediateState = value;
            })();

            if (process.env.NODE_ENV === 'development' && !immediateState) {
                throw new Error(noImmediateStateOnServerError(name));
            }

            return immediateState!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        });

        return state;
    } else {
        const {state$} = (useContext<WidgetContext<S>>(context) || {});
        const subscription = useRef<Unsub>();

        let immediateState: S | undefined;

        // On the first event, set the immediate value.
        // NOTE: The first event is guaranteed to be emitted immediately.
        const observer = useRef<Sink<S>>((value: S) => {
            immediateState = value;
        });

        const [state, setState] = useState<S>(() => {
            // Ensure we're in the context's scope.
            if (!state$) {
                throw new Error(noContext());
            }

            subscription.current = withSkipDuplicates<S>(state$, compare).onValue((value: S) => {
                observer.current(value);
            });

            // On subsequent events (or the initial event if it wasn't produced immediately), update the state.
            observer.current = (value: S) => {
                setState(value);
            };

            // In case there is no immediate state, default to {} so errors aren't thrown when destructuring the result of useWidgetState(context)
            return immediateState!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        });

        // Unsubscribe
        useEffect(() => () => {
            if (subscription.current) {
                subscription.current();
            }
        }, []);

        return state;
    }
}

// If compare is a function, return state$ with its duplicates skipped based on the function.
// If compare is an array, return state$ with duplicates skipped based on equality of the properties specified in the array.
// Otherwise, return state$ as is.
function withSkipDuplicates<S>(state$: Property<S>, compare?: CompareWidgetState<S>): Property<S> {
    if (typeof compare === 'function') {
        return state$.skipDuplicates(compare);
    }

    if (Array.isArray(compare)) {
        return state$.skipDuplicates((a = {} as S, b = {} as S) => compare.every((property) => a[property] === b[property]));
    }

    return state$;
}
