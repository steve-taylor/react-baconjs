import React from 'react';

export default React.forwardRef(function VerySimple({x}, ref) { // eslint-disable-line react/prop-types
    return (
        <section ref={ref}>
            {x}
        </section>
    );
});
