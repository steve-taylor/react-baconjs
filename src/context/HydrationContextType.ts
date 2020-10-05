import {BaseProps, Serializable} from '../types'

type HydrationContextType<
    Props extends BaseProps,
    Hydration extends Serializable,
> = (name: string, props: Props) => {
    hydration?: Hydration
    elementId?: string
}

export default HydrationContextType
