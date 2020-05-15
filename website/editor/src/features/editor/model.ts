import {createEvent} from 'effector'

export const changeSources = createEvent<string>()
export const selectVersion = createString<string>()
