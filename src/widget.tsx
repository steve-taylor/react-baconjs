import {Bus, combineTemplate, combineWith, constant, Error, later, mergeAll, never, Property} from 'baconjs'
import isEqual from 'lodash/isEqual'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import HydrationContextConsumer from './context/HydrationContextConsumer'
import PhaseContext from './context/PhaseContext'
import ServerContextConsumer from './context/ServerContextConsumer'
import ServerContextProvider from './context/ServerContextProvider'
import {SSR_TIMEOUT_ERROR} from './errors'
import keyFor from './keyFor'
import Phase from './Phase'
import {BaseProps, ReactComponentType, Serializable, WidgetContext, WidgetData, WidgetType} from './types'

type WidgetOptions<PROPS extends BaseProps, STATE, HYDRATION extends Serializable, META> = {
    name: string
    context: React.Context<WidgetContext<STATE>>
    component: ReactComponentType<Record<string, unknown>>
    state: CreateStateStream<STATE, PROPS>
    dehydrate: Dehydrate<HYDRATION, STATE>
    hydrate: Hydrate<STATE, HYDRATION, PROPS>
    meta: GetMeta<META, STATE, PROPS>
    timeout?: number
}

type CreateStateStream<STATE, PROPS extends BaseProps> = (
    props$: Property<PROPS>,
    hydrated$: Property<{props: PROPS, state: STATE}>
) => Property<STATE>

type Dehydrate<HYDRATION extends Serializable, STATE> = (state: STATE) => HYDRATION

type Hydrate<STATE, HYDRATION extends Serializable, PROPS extends BaseProps = never> = (hydration: HYDRATION, props: PROPS) => STATE

type GetMeta<META, STATE, PROPS extends BaseProps = never> = (props: PROPS, state: STATE) => META

/**
 * Create a widget.
 *
 * A widget is a React component whose state is driven by a Bacon.js Property
 * and which can be rendered isomorphically.
 *
 * @param name      - the widget’s unique name
 * @param Context   - the widget’s unique context
 * @param Component - the widget’s React component
 * @param state     - callback that creates the state Property
 * @param dehydrate - callback that dehydrates state
 * @param hydrate   - callback that rehydrates state
 * @param meta      - callback that maps props and state to SSR metadata
 * @param timeout   - optional SSR timeout
 * @returns the new widget
 */
export default function widget<PROPS extends BaseProps, STATE, HYDRATION extends Serializable, META>(
    {
        name,
        context: Context,
        component: Component,
        state,
        dehydrate,
        hydrate,
        meta,
        timeout,
    }: WidgetOptions<PROPS, STATE, HYDRATION, META>
): WidgetType<PROPS> {
    type WidgetComponentProps = PROPS & {innerRef: React.Ref<unknown>}

    type Hydrated = {
        props: PROPS
        state: STATE
    }

    type WidgetComponentState = {
        propsBus: Bus<PROPS>
    }

    interface WidgetComponent {
        props$: Property<PROPS>
        state$: Property<STATE> | undefined
        isHydrated: boolean
    }

    class Widget extends React.Component<WidgetComponentProps> implements WidgetComponent {
        // Trigger a re-render of state-dependant when innerRef changes.
        static getDerivedStateFromProps({innerRef, ...props}: WidgetComponentProps, state: WidgetComponentState): null {
            state.propsBus.push(props as unknown as PROPS)

            return null
        }

        state: WidgetComponentState = {
            propsBus: new Bus<PROPS>(),
        }

        shouldComponentUpdate(nextProps: WidgetComponentProps): boolean {
            // Only re-render if the ref has changed.
            return nextProps.innerRef !== this.props.innerRef
        }

        props$: Property<PROPS> = constant(this.props).map(({innerRef, ...props}) => props as PROPS).concat(this.state.propsBus)
        state$: Property<STATE> | undefined
        isHydrated = false

        render() {
            const {innerRef, ...props} = this.props

            return (
                <PhaseContext.Consumer>
                    {(getPhase) => {
                        switch (getPhase()) {
                            case Phase.server: // Server-side rendering
                                return (
                                    <ServerContextConsumer<STATE, HYDRATION, META>>
                                        {({getStream, registerStream, onError, onMeta}) => {
                                            // Ensure props are serializable at dev time when using JavaScript instead of TypeScript
                                            if (
                                                process.env.NODE_ENV === 'development'
                                                && !isEqual(props, JSON.parse(JSON.stringify(props)))
                                            ) {
                                                console.error(`Widget "${name}" won’t correctly hydrate with the following props because they’re not serializable:`, props)
                                                console.error('The behavior of this widget in the browser is undefined.')
                                            }

                                            const key = keyFor(name, props as PROPS)
                                            let stream$: Property<WidgetData<STATE, HYDRATION, META>> = getStream(key)

                                            if (!stream$) {
                                                const state$ = state(this.props$, never<Hydrated>().toProperty())

                                                stream$ = combineTemplate({
                                                    state: state$,
                                                    hydration: state$.map(dehydrate),
                                                    meta: combineWith(meta, this.props$, state$),
                                                })
                                                    .first()

                                                registerStream!(key, stream$) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                                            }

                                            let immediate = true
                                            let immediateValue: STATE | undefined
                                            let hasImmediateValue = false

                                            mergeAll(
                                                stream$
                                                    .first()
                                                    .doAction(({state}) => {
                                                        // Get the first value if it resolves synchronously
                                                        if (immediate) {
                                                            hasImmediateValue = true
                                                            immediateValue = state
                                                        }
                                                    })
                                                    .doAction(({meta}) => {
                                                        // If we're accumulating metadata and there's metadata to accumulate, accumulate it.
                                                        if (onMeta && meta) {
                                                            onMeta(meta)
                                                        }
                                                    })
                                                    .doError((error) => {
                                                        if (immediate) {
                                                            onError?.(error)
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
                                                        const state$ = stream$.map(({state}) => state)

                                                        // When the stream resolves later, continue walking the tree.
                                                        ReactDOMServer.renderToStaticMarkup(
                                                            <PhaseContext.Provider value={() => Phase.server}>
                                                                <ServerContextProvider<STATE, HYDRATION, META> value={{getStream, registerStream}}>
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
                                                        )
                                                    }
                                                })
                                                .catch((error) => {
                                                    onError?.(error)
                                                })

                                            immediate = false

                                            // If the stream is resolved, render this component.
                                            if (hasImmediateValue) {
                                                return (
                                                    <Context.Provider
                                                        value={{
                                                            state$: constant(immediateValue as STATE),
                                                            name,
                                                        }}
                                                    >
                                                        <Component ref={innerRef} />
                                                    </Context.Provider>
                                                )
                                            } else {
                                                // We don't have an immediate value, so don't render any further.
                                                return null
                                            }
                                        }}
                                    </ServerContextConsumer>
                                )

                            case Phase.hydration: // Hydrating
                                if (!this.isHydrated) {
                                    this.isHydrated = true

                                    return (
                                        <HydrationContextConsumer<PROPS, HYDRATION>>
                                            {(getHydration) => {
                                                const {hydration, elementId} = getHydration(name, props as PROPS)

                                                if (!this.state$) {
                                                    // Pass the state object to subscribers (Inject and useWidgetState)
                                                    if (hydration !== undefined) {
                                                        this.state$ = this
                                                            .props$
                                                            .first()
                                                            .flatMapLatest(firstProps => {
                                                                const hydratedState = hydrate(hydration, firstProps)

                                                                return constant(hydratedState)
                                                                    .concat(state(
                                                                        this.props$.skip(1),
                                                                        constant<Hydrated>({
                                                                            props: firstProps,
                                                                            state: hydratedState,
                                                                        })
                                                                    ))
                                                            })
                                                    } else {
                                                        // In case hydration data isn’t available (probably a serialization issue),
                                                        // fall back to pure client-side rendering.
                                                        this.state$ = state(this.props$, never<Hydrated>().toProperty())
                                                    }
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
                                                )
                                            }}
                                        </HydrationContextConsumer>
                                    )
                                }

                            // Pure client-side rendering or fallthrough from HYDRATION because the component is already hydrated
                            default: { // eslint-disable-line no-fallthrough
                                if (!this.state$) {
                                    // Pass the state object to subscribers (Inject and useWidgetState)
                                    this.state$ = state(this.props$, never<Hydrated>().toProperty())
                                }

                                return (
                                    // If this component was hydrated (and now we're performing a post-hydration render),
                                    // HydrationContext.Consumer was rendered in this position, so it needs to continue being rendered
                                    // on post-hydration renders to prevent Component being unmounted and recreated. This only happens when
                                    // this component's ref changes (see shouldComponentUpdate).
                                    <HydrationContextConsumer<PROPS, HYDRATION>>
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
                                )
                            }
                        }
                    }}
                </PhaseContext.Consumer>
            )
        }
    }

    const RefForwardedWidget = React.forwardRef<unknown, PROPS>(
        (props: PROPS, ref: React.Ref<unknown>) => <Widget {...props} innerRef={ref} />
    ) as ReactComponentType<PROPS>

    (RefForwardedWidget as WidgetType<PROPS>).__widget_name__ = name
    RefForwardedWidget.displayName = name

    return RefForwardedWidget as WidgetType<PROPS>
}
