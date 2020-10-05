import {Property} from 'baconjs'

import {Serializable, WidgetData} from '../types'

type ServerContextType<State, Hydration extends Serializable, Meta> = {
    getStream: (key: string) => Property<WidgetData<State, Hydration, Meta>>
    registerStream?: (key: string, stream$: Property<WidgetData<State, Hydration, Meta>>) => void
    onMeta?: (meta: Meta) => void
    onError?: (error: unknown) => void
}

export default ServerContextType
