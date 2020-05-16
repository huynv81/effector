import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Effector from 'effector'
import * as EffectorReact from 'effector-react'

import * as realm from '~/features/realm'
import {consoleMap} from '~/features/logs'

export function prepareRuntime(
  effector: typeof Effector,
  effectorReact: typeof EffectorReact,
  version: string,
) {
  const api = {}
  apiMap(api, {
    createEvent: effector.createEvent,
    createEffect: effector.createEffect,
    createStore: effector.createStore,
    createStoreObject: effector.createStoreObject,
    createDomain: effector.createDomain,
    createApi: effector.createApi,
    restoreEvent: effector.restoreEvent,
    restoreEffect: effector.restoreEffect,
    restore: effector.restore,
    combine: effector.combine,
    sample: effector.sample,
    merge: effector.merge,
    split: effector.split,
    clearNode: effector.clearNode,
  })
  apiMap(api, {
    createComponent: effectorReact.createComponent,
  })
  assignLibrary(api, effector)
  assignLibrary(api, effectorReact)
  return {
    React,
    ReactDOM,
    console: consoleMap(),
    setInterval,
    setTimeout,
    clearInterval,
    clearTimeout,
    __VERSION__: version,
    effector,
    ...api,
  }
}
function clearInterval(id: NodeJS.Timeout) {
  realm.intervalClear(id)
}
function clearTimeout(id: NodeJS.Timeout) {
  realm.timeoutClear(id)
}
function setInterval<TArguments extends Array<any>>(
  callback: (...args: TArguments) => void,
  timeout?: number,
  ...args: TArguments
) {
  const id = global.setInterval(callback as any, timeout ?? 0, ...args)
  realm.interval(id)
  return id
}

function setTimeout<TArguments extends Array<any>>(
  callback: (...args: TArguments) => void,
  timeout?: number,
  ...args: TArguments
) {
  const id = global.setTimeout(callback as any, timeout ?? 0, ...args)
  realm.timeout(id)
  return id
}

function assignLibrary<E extends Record<string, any>>(target: E, effector: E) {
  for (const method in effector) {
    if (method in target) continue
    target[method] = effector[method]
  }
  return target
}

function apiMap(target: Record<string, any>, obj: Record<string, Function>) {
  for (const key in obj) {
    target[key] = apiFabric.bind(null, obj[key], key)
  }
  return target
}

function apiFabric(fn: Function, method: string, ...params: any[]) {
  const instance = fn(...params)
  realm.invoke({method, params, instance})
  return instance
}
