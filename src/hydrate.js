import React from 'react';
import ReactDOM from 'react-dom';

import {HydrationContext, PhaseContext, HYDRATION} from './context';
import keyFor from './key-for';

/**
 * Hydrate all dehydrated instances of the specified widget, returning a <code>Promise</code>.
 *
 * @param {Object}                   Widget                          - a widget created with <code>widget</code>
 * @param {Object}                   [options]                       - options (see below)
 * @param {boolean}                  [options.warnIfNotFound=false]  - whether or not to warn if the dehydrated widget is not found
 * @param {boolean}                  [options.warnIfAlreadyHydrated] - whether or not to warn if the widget has already been hydrated
 * @returns {undefined}
 */
export default function hydrate(
    Widget,
    {
        warnIfNotFound = false,
        warnIfAlreadyHydrated = true,
    } = {}
) {
    /* istanbul ignore next */
    if (typeof window === 'undefined') {
        console.warn('Cannot hydrate a component outside a browser.');

        return;
    }

    if (!Widget.__widget_name__) {
        console.error('Cannot hydrate a component that isn\'t a widget.');

        return;
    }

    const {__WIDGET_DATA__: widgetData} = window;

    if (!widgetData) {
        if (warnIfNotFound) {
            console.warn('No widgets to hydrate.');
        }

        return;
    }

    const {__widget_name__: name} = Widget;
    const componentHydrations = widgetData[name];

    if (!componentHydrations) {
        if (warnIfNotFound) {
            console.warn(`No hydration data found for widget "${name}".`);
        }

        return;
    }

    if (componentHydrations.hydrated) {
        if (warnIfAlreadyHydrated) {
            console.warn(`Widget "${name}" is already hydrated.`);
        }

        return;
    }

    for (const [elementId, elementHydration] of Object.entries(componentHydrations).filter(([elementId]) => elementId !== 'hydrated')) {
        // Shouldn't happen.
        if (elementHydration.hydrated) {
            console.error(`Widget "${name}" at mount point "#${elementId}" is already hydrated.`);
            continue;
        }

        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Cannot hydrate widget "${name}" at mount point "#${elementId}" because the mount point was not found.`);
            continue;
        }

        try {
            const {props, hydration} = elementHydration;

            hydrateElement({Widget, element, props, hydration});
            elementHydration.hydrated = true;
        } catch (error) {
            console.error(`Widget "${name}" at "#${elementId}" threw an error while hydrating.`);
            throw error;
        }
    }

    componentHydrations.hydrated = true;
}

// Hydrate a single element
function hydrateElement(
    {
        Widget,
        element,
        props,
        hydration,
    }
) {
    const {__widget_name__: name} = Widget;

    // Debugging info
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
        console.info(`Hydrating component "${name}"...`); // eslint-disable-line no-console
    }

    if (hydration) {
        let isHydrating = true;

        // If we have initial data, hydrate the server-rendered component
        ReactDOM.hydrate(
            (
                <PhaseContext.Provider value={() => isHydrating ? HYDRATION : null}>
                    <HydrationContext.Provider
                        value={(name, props) => (
                            isHydrating
                                ? ({
                                    hydration: hydration[keyFor(name, props)],
                                    elementId: element.id,
                                })
                                : {}
                        )}
                    >
                        <Widget {...props} />
                    </HydrationContext.Provider>
                </PhaseContext.Provider>
            ),
            element,
            () => {
                isHydrating = false;
            }
        );
    } else {
        // If we don't have initial data, render over the top of anything currently in the element.
        ReactDOM.render((
            <Widget {...props} />
        ), element);
    }

    // Debugging info
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
        console.info(`Widget "${name}" hydrated 💦 at`, element); // eslint-disable-line no-console
    }
}
