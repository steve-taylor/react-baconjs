import React from 'react'
import styled from 'styled-components'
import {useWidgetState} from '../../../../src'

import nestedWithStylesContext from '../../context/nested-with-styles-context'
import SimpleWidget from '../widgets/simple'

const StyledSection = styled.section`
    padding: 7px;
    background: #bbb;
`

const StyledList = styled.ul`
    margin: 7px;
    background: #666;
    color: #ddd;
`

export default function NestedWithStyles() {
    const [state] = useWidgetState(nestedWithStylesContext)!;

    return (
        <StyledSection>
            <StyledList>
                <li>
                    {state?.a}
                </li>
                <li>
                    {state?.b}
                </li>
                <li>
                    <SimpleWidget power={4} />
                </li>
            </StyledList>
        </StyledSection>
    )
}
