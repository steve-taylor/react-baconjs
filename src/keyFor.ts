import {sha256} from 'hash.js'

import { SerializableObject } from './types'

const ignoredValueTypes: Set<string> = new Set(['undefined', 'function', 'symbol'])

/**
 * Generate a <code>hydration</code> key based on a widget name and the props of one of its instances
 * or nested widget instances.
 *
 * @param name  - widget name
 * @param props - widget instance props
 * @returns the hydration key
 */
export default function keyFor(name: string, props: SerializableObject): string {
    return `${
        name
    }--${
        sha256()
            .update(
                JSON.stringify(
                    props,
                    (key: string, value: unknown) => (
                        // Improve hydration key match probability:
                        // Sort object entries by property name.
                        typeof value === 'object' && value !== null && !Array.isArray(value)
                            ? Object
                                .entries(value)
                                // Improve hydration key match probability:
                                // Filter out entries with unserializable values.
                                .filter(([, value]) => !ignoredValueTypes.has(typeof value))
                                .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
                            : value
                    )
                )
            )
            .digest('hex')
    }`
}
