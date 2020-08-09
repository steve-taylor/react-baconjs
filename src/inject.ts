import propTypes from 'prop-types';
import React from 'react';

import {CompareWidgetState, WidgetContext} from './types';
import useWidgetState from './use-widget-state';

interface InjectOptions<S> {
    context: React.Context<WidgetContext<S>>;
    compare?: CompareWidgetState<S>;
    children: (state: S) => React.ReactNode;
}

export default function Inject<S>({
    context,
    compare,
    children,
}: InjectOptions<S>): React.ReactElement {
    const state = useWidgetState<S>(context, compare);

    return (state ? children(state) : null) as React.ReactElement;
}

/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
    Inject.propTypes = {

        /** React context for all instances of this component */
        context: propTypes.object.isRequired,

        /**
         * (Optional) A function that compares two consecutive widget states for equality,
         * or an array of widget property names to compare two consecutive
         * widget states
         */
        compare: propTypes.oneOfType([
            propTypes.func,
            propTypes.arrayOf(propTypes.string),
        ]),

        /** A render function that converts a widget state into React elements */
        children: propTypes.func.isRequired,
    };
}
