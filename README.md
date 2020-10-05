# React Bacon.js

React bindings for [Bacon.js](http://github.com/baconjs/bacon.js).
Create functional-reactive, universal web apps with ease.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/react-baconjs/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/react-baconjs.svg?style=flat)](https://www.npmjs.com/package/react-baconjs)
![npm](https://img.shields.io/npm/dw/react-baconjs.svg)
[![Build Status](https://travis-ci.org/steve-taylor/react-baconjs.svg?branch=develop)](https://travis-ci.org/steve-taylor/react-baconjs)
[![PRs Welcome](https://img.shields.io/badge/pull_requests-welcome-brightgreen.svg)](https://github.com/react-baconjs/blob/master/CONTRIBUTING.md)

## Installation

React Bacon.js requires **React 16.8.3 or later** and **Bacon.js 3.0.0 or
later**.

```
npm i -S react-baconjs
```

## What it does

React Bacon.js connects an **observable** to a **component** to create a
**widget**.

A widget is a React component whose state is managed by a Bacon.js observable.

Widgets can also be server-side rendered asynchronously, even if they have
ancestor widgets and/or descendant widgets.

Server-side rendered widgets can be hydrated, with the initial state provided
by the server, so that the browser doesn't have to call any endpoints for the
initial render.

## Comparison to React Redux

React Bacon.js is an alternative to React Redux, using Bacon.js as the state
manager instead of Redux.

The two libraries have some key differences:

|                                | React Redux                    | React Bacon.js               |
|--------------------------------|--------------------------------|------------------------------|
| Multiple stores/observables    | Discouraged                    | Encouraged                   |
| Asynchronous state change      | Requires third-party libraries | Built-in                     |
| Server-side rendering          | No                             | Yes                          |

## TypeScript support

React Bacon.js is built with TypeScript and ships with TypeScript support out
of the box.

## Usage

If you’re using TypeScript, create some types that represent the various
parts of isomorphic widgets.

```ts
// types.ts

// Widget’s prop types (must be serializable and cannot include children)
type Props = {
    userId: string
}

// Widget’s state
type State = {
    name: string
    photo: string
}

// Dehydrated state
type DehydratedState = [string, string]

// SSR metadata
type Meta = {
    maxAge: number
}
```

Create a context to connect a Bacon.js observable to your React component:

```ts
// profile-context.ts

import React from 'react'
import {InitialState, State} from './types'

export default React.createContext<InitialState | State>(undefined!)
```

Create your React component hierarchy, connecting your context to it using any
combination of `Inject`, `Loading` and `useWidgetState`:

```tsx
// profile.tsx

import React from 'react'
import {Inject, Loading} from 'react-baconjs'
import profileContext from './profile-context'
import {State} from './types'

export default function Profile() {
    return (
        <section className="profile">
            <ProfileName />
            <ProfilePhoto />
        </section>
    );
}

function ProfileName(): JSX.Element {
    return (
        <section className="profile__name">
            <Loading context={profileContext}>
                {() => (
                    <em>
                        Loading...
                    </em>
                )}
            </Loading>

            <Inject
                context={profileContext}
                compare={['name']} // render only when the 'name' state property changes
            >
                {({name}) => name}
            </Inject>
        </section>
    )
}

function ProfilePhoto(): JSX.Element {
    const [state, isLoading] = useWidgetState(
        profileContext,
        ['photo'] // render only when state.photo changes
    )

    return (
        <section className="profile__photo">
            <img
                className="profile__photo-img"
                src={isLoading ? '/static/img/profile-loading.gif' : state!.photo}
                alt={isLoading ? 'Loading profile' : 'Profile photo'}
            />
        </section>
    )
}
```

Define your component’s state stream and create a widget:

```tsx
// profile-widget.tsx
import {combineTemplate, constant, Property} from 'baconjs'
import {widget, WidgetData} from 'react-baconjs'
import Profile from './profile'
import profileContext from './profile-context'
import fetchName from './streams/fetch-name'
import fetchPhoto from './streams/fetch-photo'
import {Props, State, Hydration, Meta} from './types'

const ProfileWidget = widget<Props, State, Hydration, Meta>({
    name: 'profile',
    context: profileContext,
    component: Profile,
    state,
    dehydrate,
    hydrate,
    meta,
})

// Generate state stream from props stream.
function state(
    props$: Property<Props>,
    hydratedProps?: Props,  // provided on hydration only
    hydratedState?: State   // provided on hydration only
): Property<State> {
    const userId$ = props$.map(({userId}) => userId)

    return combineTemplate({
        name: userId$.flatMapLatest(fetchName),
        photo: userId$.flatMapLatest(fetchPhoto),
    })
}

// [Server only] Dehydrate SSR state on the server for hydration on the client.
function dehydrate([name, photo]: State): Hydration {
    return [name, photo]
}

// [Client] Hydrate dehydrated SSR state, optionally also using props
function hydrate([name, photo]: Hydration, props: Props): State {
    return {name, photo}
}

// [Server] Generate metadata, potentially derived from state.
function meta(state: State): Meta {
    return {maxAge: 60}
}
```

Somewhere on the server:

```tsx
import React from 'react'
import {renderToHtml} from 'react-baconjs'
import ProfileWidget from './profile-widget'
import {Meta} from './types'

// Server-side render an HTML page consisting of the profiles from a list of
// user IDs.
async function renderUserProfilesPage(userIds: string[]): {
    maxAge: number
    html: string
} {
    let maxAge = 60 // Default max-age to 60s

    // Generate server-side rendered profile of users
    const htmlArray = await Promise.all(
        userIds.map((userId) => renderToHtml(
            <ProfileWidget userId={userId} />,
            {
                onMeta: (metadata: Meta) => {
                    // Keep the smallest non-zero maxAge
                    if (data.maxAge && data.maxAge < maxAge) {
                        maxAge = data.maxAge
                    }
                },
            }
        ))
    )

    return {
        maxAge,
        html: `<body>${htmlArray.join('')}</body>`,
    }
}
```

When `renderToHtml` is called, it will call each widget's `state` function,
passing in a Bacon.js `Property` that emits the widget's props (in this case,
`userId`) every time it’s rendered. When the stream returned by `state`
produces its first event (an object consisting of `state` to inject into the
React component and `hydration` to attach to the HTML page), the widget’s React
component will be rendered with the `state` as its `props` and the `hydration`
data will be rendered adjacent to it in the HTML page. The `meta` property of
the event will be passed to the `onMeta` function specified in `renderToHtml`,
if specified at all. It is up to the `onMeta` function to accumulate `meta`
objects as it sees fit, bearing in mind that `onMeta` is called in render
order, which is defined by `ReactDOM.renderToString`.

Somewhere on the client:

```ts
import {hydrate} from 'react-baconjs'
import ProfileWidget from './profile-widget'

// Hydrate all instances of profile-widget on the page
hydrate(ProfileWidget)
```

When `hydrate` is called, it finds all the server-side rendered instances of
the widget in the DOM, reads their attached `props` and `hydration` data, then
hydrates each widget.

## Refs

Refs work as expected. Any `ref` passed to a widget will be forwarded to the
underlying component.

```jsx harmony
function SomeComponent({userId}) {
    const profileRef = useRef(null)

    return (
        <ProfileWidget
            ref={profileRef} // ref forwarded to Profile
            userId={userId}
        />
    )
}
```

The underlying component must be capable of taking a `ref`. Note: `Inject` is
incapable of forwarding `ref`s.

## Support for styled-components

The server-side rendering portion of the above example can be updated as
follows:

```tsx
import React from 'react'
import {renderToHtml, StyledComponentsServerRenderer} from 'react-baconjs'
import ProfileWidget from './profile-widget'

// Server-side render an HTML page consisting of the profiles from a list of
// user IDs.
async function renderUserProfilesPage(userIds: string[]): {
    maxAge: number
    html: string
} {
    // Generate server-side rendered profile of users
    const renderer = new StyledComponentsServerRenderer()
    const htmlArray = await Promise.all(
        userIds.map((userId) => renderToHtml(
            <ProfileWidget userId={userId} />,
            {renderer}
        ))
    )

    return `<head>${
        renderer.getStyleTags()
    }</head><body>${
        htmlArray.join('')
    }</body>`
}
```

This uses `StyledComponentsServerRenderer` as an alternative renderer, which
uses `ServerStyleSheet` from styled-components to gather rendered stylesheets.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) in this repo
for contribution guidelines.
