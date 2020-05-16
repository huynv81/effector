import {createStore, createEvent, createEffect, guard} from 'effector'
import * as codebox from '@zerobias/codebox'

import {performLint} from '~/features/editor'
import {$flowToggle, $typeHoverToggle} from '~/features/settings'

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

export const $typeHints = createStore<string | null>(null)
export const $typeErrors = createStore<FlowError[]>([])

export const typeNode = document.createElement('div')

typeNode.className = 'type-hover'

$flowToggle.watch(enabled => {
  if (enabled) {
    checkContentFx.use(body => codebox.flow(body))
    typeAtPosFx.use(({filename, body, line, col}) =>
      codebox.typeAtPos({filename, body, line, col}).then(data => {
        if (data.code === 'fail') return Promise.reject(data)
        return data
      }),
    )
  } else {
    checkContentFx.use(() => ({
      code: 'fail',
      processTime: 0,
      success: true,
      service: 'flow',
    }))
    typeAtPosFx.use(async () => Promise.reject())
  }
  performLint()
})

$typeErrors
  .on(checkContentFx.done, (state, {result}) => {
    if (result.code === 'fail') return state
    return result.code
  })
  .reset(checkContentFx.fail)

$typeHints
  // @ts-ignore
  .on(typeAtPosFx.done, (_, {result}) => result.code.c)
  .reset(typeAtPosFx.fail)

guard({
  source: showTypeNode,
  filter: $typeHoverToggle,
}).watch(() => {
  typeNode.style.opacity = '1'
  typeNode.style.visibility = 'inherit'
})
guard({
  source: hideTypeNode,
  filter: $typeHoverToggle,
}).watch(() => {
  typeNode.style.opacity = '0'
  typeNode.style.visibility = 'hidden'
})
guard({
  source: typeAtPosFx.fail,
  filter: $typeHoverToggle,
  target: hideTypeNode,
})
guard({
  source: $typeHints.map(hint => {
    if (hint === null) return 'Loading...'
    return hint
  }),
  filter: $typeHoverToggle,
}).watch(hint => {
  typeNode.innerText = hint
})
