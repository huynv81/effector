import {createStore} from 'effector'

export const $typeChecker = createStore<'flow' | 'typescript' | null>(null)
export const $typeHoverToggle = createStore(false)
