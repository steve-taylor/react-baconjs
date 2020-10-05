import React, {useLayoutEffect, useRef} from 'react'
import ReactDOM from 'react-dom'

import VerySimpleWidget1 from './data/hook/widgets/very-simple'
import VerySimpleWidget2 from './data/inject/widgets/very-simple'

describe('Forward refs to underlying component', () => {
    let mountElement: HTMLDivElement | undefined

    beforeEach(() => {
        mountElement = document.body.appendChild(document.createElement('div'))
    })

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(mountElement!)
        document.body.removeChild(mountElement!)
    });

    [
        {
            name: 'useWidgetState()',
            VerySimpleWidget: VerySimpleWidget1,
        },
        {
            name: '<Inject />',
            VerySimpleWidget: VerySimpleWidget2,
        },
    ].forEach(({name, VerySimpleWidget}) => {
        describe(name, () => {
            beforeEach(() => {
                const Component: React.FC<{}> = () => {
                    const ref = useRef<HTMLElement>(null)

                    useLayoutEffect(() => {
                        // Vandalize the DOM element
                        ref.current!.className = 'ref-test'
                    }, [])

                    return (
                        <VerySimpleWidget
                            ref={ref}
                            power={2}
                        />
                    )
                }

                ReactDOM.render(<Component />, mountElement!)
            })

            test('it changes the root element’s className', () => {
                expect(mountElement!.querySelector('section')!.className).toBe('ref-test')
            })
        })
    })
})
