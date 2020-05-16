import {createStore} from 'effector'
export class StackFrame {
  _originalFileName: string = ''
  _originalLineNumber: number | void = undefined
  _originalColumnNumber: number | void = undefined
}
export const $versionLoader = createStore({})
export async function evaluator(_code: string): Promise<any> {}
