import styled from 'styled-components'

declare module 'styled-components' {
    export const __DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS: {
        StyleSheet: {
            reset: (forceServer?: boolean) => void
        }
    }
}
