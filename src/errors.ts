export const SSR_TIMEOUT_ERROR = Symbol('timeout')

export function noImmediateStateOnServerError(name: string): string {
    return `An unexpected error occurred while server-side rendering “${name || '(unknown)'}”`
}

export function noContext(): string {
    return 'Cannot use Inject or useWidgetState outside the scope of the specified context’s widget.'
}
