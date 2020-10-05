import Phase from '../Phase'

type PhaseContextType = () => typeof Phase['hydration'] | typeof Phase['server'] | null

export default PhaseContextType
