import propTypes from 'prop-types';

import useWidgetState from './use-widget-state';

export default function Inject({
    context,
    compare,
    children,
}) {
    const state = useWidgetState(context, compare);

    return state ? children(state) : null;
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
