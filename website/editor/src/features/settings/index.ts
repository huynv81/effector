import {createStore, createEvent} from 'effector'

export const $autoScrollLogs = createStore(false)
export const $flowToggle = createStore(false)
export const $typeChecker = createStore<'flow' | 'typescript' | null>(null)
export const $typeHoverToggle = createStore(false)

export const enableAutoScroll = createEvent()
export const disableAutoScroll = createEvent()
