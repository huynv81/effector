import {createEffect, createEvent} from 'effector'
import {FlowError} from './types'

interface TypeAtPos {
  filename: string
  body: string
  line: number
  col: number
}
interface TypeAtPosResult {
  code: {c: string; t: number; l: number} | 'fail'
  success: boolean
  processTime: number
  service: 'type-at-pos'
}
interface CheckContentResult {
  code: FlowError[] | 'fail'
  success: boolean
  processTime: number
  service: 'flow'
}

export const showTypeNode = createEvent()
export const hideTypeNode = createEvent()

export const typeAtPosFx = createEffect<TypeAtPos, TypeAtPosResult, unknown>()
export const checkContentFx = createEffect<
  string,
  CheckContentResult,
  unknown
>()

export const typeNode = document.createElement('div')
