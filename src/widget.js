import React from 'react';
import ReactDOMServer from 'react-dom/server';
import propTypes from 'prop-types';
import {Bus, constant, Error, later, mergeAll, never} from 'baconjs';

import {PhaseContext, ServerContext, HydrationContext, SERVER, HYDRATION} from './context';
import {SSR_TIMEOUT_ERROR} from './errors';
import keyFor from './key-for';
import Inject from './inject';

/**
 * A function to create a Bacon.js <code>Observable</code>, optionally taking initial data when hydrating in the browser.
 *
 * When <code>immediate</code> is <code>true</code>, the stream must produce its first event to subscribers immediately.
 * If <code>hydration</code> is provided, it should contain sufficient information to allow the stream to produce its
 * first event immediately, without producing a loading state. When <code>hydration</code> isn't provided and there is
 * otherwise insufficient data to produce an event immediately, the stream should produce an event that indicates a
 * loading state immediately.
 *
 * @callback getData
 * @param {Object}               props         - props passed to the widget, some of which it may use to look up data
 * @param {Object|undefined}     hydration     - initial data if we're in the browser and hydrating
 * @param {boolean}              immediate     - whether or not the stream should produce its first event to subscribers immediately
 */

/**
 * Create widget from a React component and a Bacon.js observable.
 *
 * When a React context is provided, the state emitted by the <code>getData</code> stream is made available via the context, allowing any
 * child of this component to tap into the state via the context.
 *
 * When a React context isn't provided, the emitted state is fed directly into the component's props.
 *
 * @param {Object}        widget               - widget details
 * @param {string}        widget.name          - name
 * @param {Function}      widget.component     - React component
 * @param {React.Context} [widget.context]     - context to provide and consume the data stream
 * @param {getData}       widget.getData       - data stream creation function
 * @param {number}        [widget.timeout]     - the number of milliseconds to wait for the stream to emit its first value
 * @returns {Function} the created widget
 */
export default function widget({
    name,
    component: C,
    context,
    getData,
    timeout,
}) {
    // When a context isn't provided, inject the state directly into the component.
    const Context = context || React.createContext(null);
    let Component;

    if (context) {
        Component = C;
    } else {
        Component = React.forwardRef((props, ref) => (
            <Inject context={Context}>
                {(state) => <C {...state} ref={ref} />}
            </Inject>
        ));

        Component.displayName = C.displayName || C.name;
    }

    class Widget extends React.Component {
        static propTypes = {
            innerRef: propTypes.oneOfType([propTypes.object, propTypes.func]),
        };

        state = {
            propsBus: new Bus(),
        };

        static getDerivedStateFromProps({innerRef, ...props}, state) {
            state.propsBus.push(props);

            return null;
        }

        shouldComponentUpdate(nextProps) {
            // Only re-render if the ref has changed.
            return nextProps.innerRef !== this.props.innerRef;
        }

        props$ = constant(this.props).map(({innerRef, ...props}) => props).concat(this.state.propsBus); // eslint-disable-line newline-per-chained-call
        hydration = null;
        data$ = null;
        isHydrated = false;

        render() {
            const {innerRef, ...props} = this.props;

            return (
                <PhaseContext.Consumer>
                    {(getPhase) => {
                        switch (getPhase()) {
                            case SERVER: // Server-side rendering
                                return (
                                    <ServerContext.Consumer>
                                        {({getStream, registerStream, onError, onData}) => {
                                            const key = keyFor(name, props);
                                            let stream$ = getStream(key);

                                            if (!stream$) {
                                                stream$ = getData(this.props$, undefined, false).first();
                                                registerStream(key, stream$);
                                            }

                                            let immediate = true;
                                            let immediateValue = null;
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
                                                    .doAction(({data}) => {
                                                        // If we're accumulating data and there's data to accumulate, accumulate it.
                                                        if (onData && data) {
                                                            onData(data);
                                                        }
                                                    })
                                                    .doError((error) => {
                                                        if (immediate) {
                                                            onError(error);
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
                                                        const data$ = stream$.map(({state}) => state);

                                                        // When the stream resolves later, continue walking the tree.
                                                        ReactDOMServer.renderToStaticMarkup(
                                                            <PhaseContext.Provider value={() => SERVER}>
                                                                <ServerContext.Provider value={{getStream, registerStream}}>
                                                                    <Context.Provider
                                                                        value={{
                                                                            data$,
                                                                            name,
                                                                        }}
                                                                    >
                                                                        <Component ref={innerRef} />
                                                                    </Context.Provider>
                                                                </ServerContext.Provider>
                                                            </PhaseContext.Provider>
                                                        );
                                                    }
                                                })
                                                .catch((error) => {
                                                    onError(error);
                                                });

                                            immediate = false;

                                            // If the stream is resolved, render this component.
                                            if (hasImmediateValue) {
                                                return (
                                                    <Context.Provider
                                                        value={{
                                                            data$: constant(immediateValue),
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
                                    </ServerContext.Consumer>
                                );

                            case HYDRATION: // Hydrating
                                if (!this.isHydrated) {
                                    this.isHydrated = true;

                                    return (
                                        <HydrationContext.Consumer>
                                            {(getHydration) => {
                                                const {hydration, elementId} = getHydration ? getHydration(name, props) : {};

                                                if (!this.data$) {
                                                    this.data$ = getData(
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
                                                            data$: this.data$,
                                                            name,
                                                            elementId,
                                                        }}
                                                    >
                                                        <Component ref={innerRef} />
                                                    </Context.Provider>
                                                );
                                            }}
                                        </HydrationContext.Consumer>
                                    );
                                }

                            default: { // Pure client-side rendering or fallthrough from HYDRATION because the component is already hydrated
                                if (!this.data$) {
                                    this.data$ = getData(
                                        this.props$,
                                        null,
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
                                    <HydrationContext.Consumer>
                                        {() => (
                                            <Context.Provider
                                                value={{
                                                    data$: this.data$,
                                                    name,
                                                }}
                                            >
                                                <Component ref={innerRef} />
                                            </Context.Provider>
                                        )}
                                    </HydrationContext.Consumer>
                                );
                            }
                        }
                    }}
                </PhaseContext.Consumer>
            );
        }
    }

    const RefForwardedWidget = React.forwardRef((props, ref) => <Widget {...props} innerRef={ref} />);

    RefForwardedWidget.displayName = name;
    RefForwardedWidget.__widget_name__ = name;

    return RefForwardedWidget;
}
