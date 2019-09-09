import React from 'react';

import SimpleWidget from '../widgets/simple';

export default function Nested({isLoading, a, b}) { // eslint-disable-line react/prop-types
    return (
        <section>
            {isLoading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <ul>
                    <li>
                        {a}
                    </li>
                    <li>
                        {b}
                    </li>
                    <li>
                        <SimpleWidget power={4} />
                    </li>
                </ul>
            )}
        </section>
    );
}
