import React from 'react'
import {useWidgetState} from '../../../../src'

import nestedContext from '../../context/nested-context'
import SimpleWidget from '../widgets/simple'

export default function Nested() {
    const [state, isLoading] = useWidgetState(nestedContext)!

    return (
        <section>
            {isLoading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <ul>
                    <li>
                        {state!.a}
                    </li>
                    <li>
                        {state!.b}
                    </li>
                    <li>
                        <SimpleWidget power={4} />
                    </li>
                </ul>
            )}
        </section>
    )
}
