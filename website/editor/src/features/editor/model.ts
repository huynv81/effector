import {createEvent} from 'effector'

export interface Location {
  file: string
  line: number
  column: number
}

export const changeSources = createEvent<string>()
export const selectVersion = createEvent<string>()
export const codeSetCursor = createEvent<Location>()
