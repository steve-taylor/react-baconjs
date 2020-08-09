import React, {ReactElement} from 'react';
import ReactDOMServer from 'react-dom/server';
import {combineAsArray, Property} from 'baconjs';
import serialize from 'serialize-javascript';
import {v1 as uuid} from 'uuid';

import {PhaseContext, SERVER, ServerContextProvider} from './context';
import {BaseProps, Serializable, WidgetData, WidgetType} from './types';

const defaultRender = ReactDOMServer.renderToString;

interface RenderToHtmlOptions<M> {
    render?: (element: ReactElement) => string;
    className?: string;
    onMeta?: (meta: M) => void;
}

/**
 * Asynchronously render a widget element to HTML, also rendering a script tag that stores <code>props</code> and
 * <code>hydration</code> for hydration in the browser.
 *
 * If the specified React element isn't a widget, just render it as is.
 *
 * @param widgetElement            - an instance of a widget
 * @param [options]                - (see below)
 * @param [options.render]         - an optional alternative server renderer
 * @param [options.className]      - an optional class name for the mount point
 * @returns a promise that will resolve to the element's HTML
 */
export default async function renderToHtml<P extends BaseProps, S, H extends Serializable, M = unknown>(
    widgetElement: React.ReactElement<P, WidgetType<P>>,
    {
        render = defaultRender,
        className,
        onMeta,
    }: RenderToHtmlOptions<M> = {}
): Promise<string> {
    const {__widget_name__: name} = widgetElement.type;

    // If this isn't a widget, rather than crapping out, just render it as is.
    if (!name) {
        return `<div${className ? ` class="${className}"` : ''}>${render(widgetElement)}</div>`;
    }

    interface RegisteredStreams {
        [key: string]: Property<WidgetData<S, H, M>>;
    }

    interface Hydration {
        [key: string]: H;
    }

    const registeredStreams: RegisteredStreams = {};
    const pendingKeys = new Set<string>();
    const hydration: Hydration = {};

    const getStream = (key: string) => registeredStreams[key];

    // Register stream. In the background, this stores the initial event in hydration, then deregisters the stream.
    const registerStream = (key: string, stream$: Property<WidgetData<S, H, M>>) => {
        registeredStreams[key] = stream$;
        pendingKeys.add(key);
    };

    let error: unknown;
    const onError = (e: unknown) => {
        error = e;
    };

    // Start walking the element tree.
    ReactDOMServer.renderToStaticMarkup((
        <PhaseContext.Provider value={() => SERVER}>
            <ServerContextProvider<S, H, M> value={{getStream, registerStream, onError}}>
                {widgetElement}
            </ServerContextProvider>
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
                        hydration[key] = h!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
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
            <ServerContextProvider<S, H, M> value={{getStream, onMeta}}>
                {widgetElement}
            </ServerContextProvider>
        </PhaseContext.Provider>
    ));

    const id = uuid();

    // Return the component HTML and some JavaScript to store props and initial data.
    return [
        `<div id="${id}"${className ? ` class="${className}"` : ''}>${html}</div>`,
        '<script type="text/javascript">',
        `Object.assign(["__WIDGET_DATA__","${name}","instances","${id}"].reduce(function(a,b){return a[b]=a[b]||{};},window),${serialize({props: widgetElement.props, hydration}, {isJSON: true})});`,
        '</script>',
    ].join('');
}
