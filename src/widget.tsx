import {Bus, constant, Error, later, mergeAll, never, Property} from 'baconjs';
import isEqual from 'lodash/isEqual';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
    PhaseContext,
    SERVER,
    HYDRATION,
    ServerContextConsumer,
    ServerContextProvider,
    HydrationContextConsumer,
} from './context';
import {SSR_TIMEOUT_ERROR} from './errors';
import keyFor from './key-for';
import {
    BaseProps,
    ReactComponentType,
    Serializable,
    WidgetContext,
    WidgetData, WidgetType,
} from './types';

interface CreateStream<P extends BaseProps, S, H extends Serializable, M = never> {
    /**
     * A function to create a Bacon.js <code>Property</code> that drives a
     * widget's state over time.
     *
     * When <code>hydration</code> is provided, the stream <em>should</em>
     * emit its first event immediately, to avoid rendering the loading
     * state. When <code>hydration</code> isn't provided, the stream may
     * emit its first event asynchronously, allowing the loading state to
     * be rendered in the interim.
     *
     * @param props$        - props passed to the widget, some of which it may use to look up data
     * @param hydration     - initial data if we're in the browser and hydrating
     */
    (props$: Property<P>, hydration?: H | undefined): Property<WidgetData<S, H, M>>;
}

interface WidgetOptions<P extends BaseProps, S, H extends Serializable, M> {
    name: string;
    component: ReactComponentType<Record<string, unknown>>;
    context: React.Context<WidgetContext<S>>;
    stream: CreateStream<P, S, H, M>;
    initialState: S;
    timeout?: number;
}

/**
 * Create widget from a React component and a Bacon.js observable.
 *
 * State emitted by the provided stream is made available via the context,
 * allowing any child of this component to tap into the state via the context.
 *
 * @typeParam P - widget props
 * @typeParam S - widget state
 * @typeParam H - widget hydration data
 * @typeParam M - widget metadata
 * @param widget               - widget details
 * @param widget.name          - name
 * @param widget.component     - React component
 * @param widget.context       - context to provide and consume the data stream
 * @param widget.stream        - creates a stream that emits state, hydration data and metadata
 * @param widget.initialState  - initial state for client-side rendering, typically when not hydrating
 * @param [widget.timeout]     - the number of milliseconds to wait for the stream to emit its first value
 * @returns the created widget
 */
export default function widget<P extends BaseProps, S, H extends Serializable, M = never>(
    {
        name,
        component: Component,
        context: Context,
        stream,
        initialState,
        timeout,
    }: WidgetOptions<P, S, H, M>
): WidgetType<P> {
    const getData = (props$: Property<P>, hydration: H | undefined, immediate: boolean): Property<WidgetData<S, H, M>> => {
        const stream$ = stream(props$, hydration);

        return immediate
            ? stream$.startWith({state: initialState})
            : stream$;
    }

    type WidgetComponentProps = P & {innerRef: React.Ref<unknown>};

    interface WidgetComponentState {
        propsBus: Bus<P>;
    }

    interface WidgetComponent {
        props$: Property<P>;
        state$: Property<S> | undefined;
        isHydrated: boolean;
    }

    class Widget extends React.Component<WidgetComponentProps> implements WidgetComponent {
        static getDerivedStateFromProps({innerRef, ...props}: WidgetComponentProps, state: WidgetComponentState): null {
            state.propsBus.push(props as unknown as P);

            return null;
        }

        state: WidgetComponentState = {
            propsBus: new Bus<P>(),
        };

        shouldComponentUpdate(nextProps: WidgetComponentProps): boolean {
            // Only re-render if the ref has changed.
            return nextProps.innerRef !== this.props.innerRef;
        }

        props$: Property<P> = constant(this.props).map(({innerRef, ...props}) => props as P).concat(this.state.propsBus);
        state$: Property<S> | undefined;
        isHydrated = false;

        render() {
            const {innerRef, ...props} = this.props;

            return (
                <PhaseContext.Consumer>
                    {(getPhase) => {
                        switch (getPhase()) {
                            case SERVER: // Server-side rendering
                                return (
                                    <ServerContextConsumer<S, H, M>>
                                        {({getStream, registerStream, onError, onMeta}) => {
                                            // Ensure props are serializable at dev time when using JavaScript instead of TypeScript
                                            if (
                                                process.env.NODE_ENV === 'development'
                                                && !isEqual(props, JSON.parse(JSON.stringify(props)))
                                            ) {
                                                console.error(`Widget "${name}" won’t correctly hydrate with the following props because they’re not serializable:`, props);
                                                console.error('The behavior of this widget in the browser is undefined.');
                                            }

                                            const key = keyFor(name, props as P);
                                            let stream$: Property<WidgetData<S, H, M>> = getStream(key);

                                            if (!stream$) {
                                                stream$ = getData(this.props$, undefined, false).first();
                                                registerStream!(key, stream$); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                                            }

                                            let immediate = true;
                                            let immediateValue: S | undefined;
                                            let hasImmediateValue = false;

                                            mergeAll(
                                                stream$
                                                    .first()
                                                    .doAction(({state}) => {
                                                        // Get the first value if it resolves synchronously
                                                        if (immediate) {
                                                            hasImmediateValue = true;
                                                            immediateValue = state;
                                                        }
                                                    })
                                                    .doAction(({meta}) => {
                                                        // If we're accumulating metadata and there's metadata to accumulate, accumulate it.
                                                        if (onMeta && meta) {
                                                            onMeta(meta);
                                                        }
                                                    })
                                                    .doError((error) => {
                                                        if (immediate) {
                                                            onError?.(error);
                                                        }
                                                    }),

                                                // Insert an error into the stream after the timeout, if specified, has elapsed.
                                                timeout === undefined
                                                    ? never()
                                                    : later(timeout, null).flatMapLatest(() => new Error(SSR_TIMEOUT_ERROR))
                                            )
                                                .firstToPromise()
                                                .then(() => {
                                                    if (!hasImmediateValue) {
                                                        // Pass the state object to subscribers (Inject and useWidgetState)
                                                        const state$ = stream$.map(({state}) => state);

                                                        // When the stream resolves later, continue walking the tree.
                                                        ReactDOMServer.renderToStaticMarkup(
                                                            <PhaseContext.Provider value={() => SERVER}>
                                                                <ServerContextProvider<S, H, M> value={{getStream, registerStream}}>
                                                                    <Context.Provider
                                                                        value={{
                                                                            state$,
                                                                            name,
                                                                        }}
                                                                    >
                                                                        <Component ref={innerRef} />
                                                                    </Context.Provider>
                                                                </ServerContextProvider>
                                                            </PhaseContext.Provider>
                                                        );
                                                    }
                                                })
                                                .catch((error) => {
                                                    onError?.(error);
                                                });

                                            immediate = false;

                                            // If the stream is resolved, render this component.
                                            if (hasImmediateValue) {
                                                return (
                                                    <Context.Provider
                                                        value={{
                                                            state$: constant(immediateValue as S),
                                                            name,
                                                        }}
                                                    >
                                                        <Component ref={innerRef} />
                                                    </Context.Provider>
                                                );
                                            } else {
                                                // We don't have an immediate value, so don't render any further.
                                                return null;
                                            }
                                        }}
                                    </ServerContextConsumer>
                                );

                            case HYDRATION: // Hydrating
                                if (!this.isHydrated) {
                                    this.isHydrated = true;

                                    return (
                                        <HydrationContextConsumer<P, H>>
                                            {(getHydration) => {
                                                const {hydration, elementId} = getHydration(name, props as P);

                                                if (!this.state$) {
                                                    this.state$ = getData(
                                                        this.props$,
                                                        hydration,
                                                        true
                                                    )
                                                        // Pass the state object to subscribers (Inject and useWidgetState)
                                                        .map(({state}) => state);
                                                }

                                                return (
                                                    <Context.Provider
                                                        value={{
                                                            state$: this.state$,
                                                            name,
                                                            elementId,
                                                        }}
                                                    >
                                                        <Component ref={innerRef} />
                                                    </Context.Provider>
                                                );
                                            }}
                                        </HydrationContextConsumer>
                                    );
                                }

                            // Pure client-side rendering or fallthrough from HYDRATION because the component is already hydrated
                            default: { // eslint-disable-line no-fallthrough
                                if (!this.state$) {
                                    this.state$ = getData(
                                        this.props$,
                                        undefined,
                                        true
                                    )
                                        // Pass the state object to subscribers (Inject and useWidgetState)
                                        .map(({state}) => state);
                                }

                                return (
                                    // If this component was hydrated (and now we're performing a post-hydration render),
                                    // HydrationContext.Consumer was rendered in this position, so it needs to continue being rendered
                                    // on post-hydration renders to prevent Component being unmounted and recreated. This only happens when
                                    // this component's ref changes (see shouldComponentUpdate).
                                    <HydrationContextConsumer<P, H>>
                                        {() => (
                                            <Context.Provider
                                                value={{
                                                    // TypeScript can't infer that this.state$ hasn't been set to undefined.
                                                    state$: this.state$!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                                                    name,
                                                }}
                                            >
                                                <Component ref={innerRef} />
                                            </Context.Provider>
                                        )}
                                    </HydrationContextConsumer>
                                );
                            }
                        }
                    }}
                </PhaseContext.Consumer>
            );
        }
    }

    const RefForwardedWidget = React.forwardRef<unknown, P>(
        (props: P, ref: React.Ref<unknown>) => <Widget {...props} innerRef={ref} />
    ) as ReactComponentType<P>;

    RefForwardedWidget.displayName = name;
    (RefForwardedWidget as WidgetType<P>).__widget_name__ = name;

    return RefForwardedWidget as WidgetType<P>;
}
