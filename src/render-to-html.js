import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {combineAsArray} from 'baconjs';
import uuid from 'uuid/v1';
import serialize from 'serialize-javascript';

import {PhaseContext, ServerContext, SERVER} from './context';

const defaultRender = ReactDOMServer.renderToString;

/**
 * Asynchronously render a widget element to HTML, also rendering a script tag that stores <code>props</code> and
 * <code>hydration</code> for hydration in the browser.
 *
 * If the specified React element isn't a widget, just render it as is.
 *
 * @param {Object}   widgetElement            - an instance of a widget
 * @param {Object}   [options]                - (see below)
 * @param {Function} [options.render]         - an optional alternative server renderer
 * @param {string}   [options.className]      - an optional class name for the mount point
 * @returns {Promise.<string>} a promise that will resolve to the element's HTML
 */
export default async function renderToHtml(
    widgetElement,
    {
        render = defaultRender,
        className,
        onData,
    } = {}
) {
    const {__widget_name__: name} = widgetElement.type;

    // If this isn't a widget, rather than crapping out, just render it as is.
    if (!name) {
        return `<div${className ? ` class="${className}"` : ''}>${render(widgetElement)}</div>`;
    }

    const registeredStreams = {};
    const pendingKeys = new Set();
    const hydration = {};

    const getStream = (key) => registeredStreams[key];

    // Register stream. In the background, this stores the initial event in hydration, then deregisters the stream.
    const registerStream = (key, stream$) => {
        registeredStreams[key] = stream$;
        pendingKeys.add(key);
    };

    let error;
    const onError = (e) => {
        error = e;
    };

    // Start walking the element tree.
    ReactDOMServer.renderToStaticMarkup((
        <PhaseContext.Provider value={() => SERVER}>
            <ServerContext.Provider value={{getStream, registerStream, onError}}>
                {widgetElement}
            </ServerContext.Provider>
        </PhaseContext.Provider>
    ));

    // Rethrow immediately produced error
    if (error) {
        throw error;
    }

    // Keep trying to synchronously render the component to HTML, retrying until nothing is waiting on pending streams.
    do {
        // Get all the currently pending keys
        const keys = [...pendingKeys];

        // Wait for all of them to resolve.
        await combineAsArray(
            keys.map((key) => (
                registeredStreams[key]
                    .first()
                    .doAction(({hydration: h}) => {
                        hydration[key] = h;
                        pendingKeys.delete(key);
                    })
            ))
        )
            .firstToPromise();

        // Remove them from pendingKeys, which may have had more keys added while waiting.
        keys.forEach((key) => pendingKeys.delete(key));

        // Rethrow any error from the element tree
        if (error) {
            throw error;
        }
    } while (pendingKeys.size);

    // Now that everything is resolved, synchronously render the html.
    const html = render((
        <PhaseContext.Provider value={() => SERVER}>
            <ServerContext.Provider value={{getStream, onData}}>
                {widgetElement}
            </ServerContext.Provider>
        </PhaseContext.Provider>
    ));

    const id = uuid();

    // Return the component HTML and some JavaScript to store props and initial data.
    return [
        `<div id="${id}"${className ? ` class="${className}"` : ''}>${html}</div>`,
        '<script type="text/javascript">',
        `Object.assign(["__WIDGET_DATA__","${name}","${id}"].reduce(function(a,b){return a[b]=a[b]||{};},window),${serialize({props: widgetElement.props, hydration}, {isJSON: true})});`,
        '</script>',
    ].join('');
}
