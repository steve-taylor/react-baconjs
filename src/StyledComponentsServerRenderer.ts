import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {ServerStyleSheet} from 'styled-components'

export default class StyledComponentsServerRenderer {
    sheet = new ServerStyleSheet()

    getStyleTags(): string {
        return this.sheet.getStyleTags()
    }

    render = (reactElement: React.ReactElement): string => ReactDOMServer.renderToString(this.sheet.collectStyles(reactElement))
}
