import {
  combine,
  createEffect,
  createEvent,
  createStore,
  forward,
  sample,
} from 'effector'

import defaultVersions from '~/versions.json'
import {StackFrame} from '~/features/evaluator'
import {resetGraphiteState} from '~/features/graphite'
import {evaluator, $versionLoader} from '~/features/evaluator'
import {$typeChecker, $typeHoverToggle} from '~/features/settings'
import {typeAtPosFx, typeNode, hideTypeNode, showTypeNode} from '~features/flow'
import {retrieveCode, retrieveVersion} from './lib/retrieve'
import {compress} from './lib/compression'

export interface Location {
  file: string
  line: number
  column: number
}

interface Editor {
  getCursor(): {line: number; ch: number; outside: boolean}
  getValue(): string
  addWidget(option: {line: number; ch: number}, element: HTMLElement): void
}

type CodeError =
  | {
      isError: true
      error: Error
      stackFrames: StackFrame[]
    }
  | {
      isError: false
      error: null
      stackFrames: StackFrame[]
    }

export const evalFx = createEffect<string, any, any>()

export const performLint = createEvent()
export const changeSources = createEvent<string>()

export const selectVersion = createEvent<string>()

export const codeSetCursor = createEvent<Location>()
export const codeCursorActivity = createEvent<Editor>()
export const codeMarkLine = createEffect<any, any, any>()

export const $version = createStore<string>(defaultVersions[0])
export const $packageVersions = createStore<string[]>(defaultVersions)
export const $sourceCode = createStore(retrieveCode())
export const $compiledCode = createStore('')
export const $codeError = createStore<CodeError>({
  isError: false,
  error: null,
  stackFrames: [],
})

evalFx.use(evaluator)

$version.on(selectVersion, (_, version) => version)

codeCursorActivity.watch(editor => {
  const cursor = editor.getCursor()
  const body = editor.getValue()
  const line = cursor.line + 1
  const col = cursor.ch

  typeAtPosFx({
    filename: '/static/repl.js',
    body,
    line,
    col,
  })
})

sample({
  source: $typeHoverToggle,
  clock: codeCursorActivity,
  fn: (enabled, editor) => ({enabled, editor}),
}).watch(({enabled, editor}) => {
  const cursor = editor.getCursor()
  if (cursor.line === 0 && cursor.ch === 0) return
  if (enabled) {
    editor.addWidget(
      {
        line: cursor.line,
        ch: cursor.ch,
      },
      typeNode,
    )
    if (cursor.outside) {
      hideTypeNode()
    } else {
      showTypeNode()
    }
  }
})

forward({
  from: evalFx,
  to: resetGraphiteState,
})

$codeError
  .on(evalFx.done, () => ({
    isError: false,
    error: null,
    stackFrames: [],
  }))
  .on(evalFx.fail, (_, {error}) => {
    if ('stack' in error) {
      return {
        isError: true,
        error,
        stackFrames: [],
      }
    }
    return {
      isError: true,
      error: error.original,
      stackFrames: error.stackFrames,
    }
  })

// TODO: define exact type
let textMarker: any

$codeError.watch(async ({stackFrames}) => {
  if (textMarker) textMarker.clear()
  for (const frame of stackFrames) {
    if (frame._originalFileName !== 'repl.js') continue
    const line = (frame._originalLineNumber || 0) - 1
    const ch = frame._originalColumnNumber || 0
    textMarker = await codeMarkLine({
      from: {line, ch},
      options: {className: 'CodeMirror-lint-mark-error'},
    })
  }
})

let lastCode: null | string = null

changeSources.map(compress).watch(code => {
  if (lastCode !== null && lastCode !== code && code) {
    localStorage.setItem('code-compressed', code)
    history.replaceState({}, '', location.origin)
  }
  lastCode = code || lastCode
})

forward({
  from: changeSources,
  to: $sourceCode,
})

const initStore = combine({
  sourceCode: $sourceCode,
  versionLoader: $versionLoader,
  typechecker: $typeChecker,
})
initStore.watch(({sourceCode}) => {
  if (sourceCode) evalFx(sourceCode)
})

changeSources(retrieveCode()!)
selectVersion(retrieveVersion())
