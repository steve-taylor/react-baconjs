import React from 'react';
import styled from 'styled-components';
import {Inject} from '../../../../src';

import nestedWithStylesContext from '../../context/nested-with-styles-context';
import SimpleWidget from '../widgets/simple';

const StyledSection = styled.section`
    padding: 7px;
    background: #bbb;
`;

const StyledList = styled.ul`
    margin: 7px;
    background: #666;
    color: #ddd;
`;

const NestedWithStyles = () => (
    <StyledSection>
        <StyledList>
            <Inject context={nestedWithStylesContext}>
                {({a}) => (
                    <li>
                        {a}
                    </li>
                )}
            </Inject>
            <Inject context={nestedWithStylesContext}>
                {({b}) => (
                    <li>
                        {b}
                    </li>
                )}
            </Inject>
            <li>
                <SimpleWidget power={4} />
            </li>
        </StyledList>
    </StyledSection>
);

export default NestedWithStyles;
