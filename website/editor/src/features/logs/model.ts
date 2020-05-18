import {createEvent, createStore} from 'effector'

import {changeSources, selectVersion} from '~/features/editor'
import * as Realm from '~/features/realm'

import {presets} from './lib/styles'
import * as Config from './config'
import {Method} from './types'

interface Log {
  id: number
  method: Method
  data: any[]
}

export const clearConsole = createEvent()
const realmLog = createEvent<{method: Method; args: any[]}>()

let nextId = 0

const parsedLog = realmLog.map(({method, args}) => {
  const id = ++nextId

  switch (method) {
    case 'error': {
      const errors = args.map(error => {
        try {
          return error.stack || error
        } catch (e) {
          return error
        }
      })

      return {
        method,
        id,
        data: errors,
      }
    }

    default: {
      return {
        method,
        id,
        data: args,
      }
    }
  }
})

export const $logs = createStore<Log[]>([])

$logs
  .on(parsedLog, (logs, log) => logs.concat(log))
  .on(Realm.status, (logs, {active}) => {
    if (!active) return logs
    return []
  })
  .reset(changeSources, selectVersion, clearConsole)

window.addEventListener(
  'keydown',
  event => {
    if (
      (event.ctrlKey && event.code === 'KeyL') ||
      (event.metaKey && event.code === 'KeyK')
    ) {
      event.preventDefault()
      event.stopPropagation()
      clearConsole()
    }
  },
  true,
)

function logger(this: any, ...args: any[]) {
  const method = this.toString()
  realmLog({method, args})
}

export function consoleMap() {
  const console: Record<string, (...args: any[]) => void> = {}

  for (const method in global.console) {
    console[method] = logger.bind(method)
  }
  return console as Record<keyof typeof global.console, Function>
}

export function printLogs(logs: {method: Method; args: any[]}[]) {
  if (Config.PRINT_IN_GROUP) console.group('runtime')
  if (Config.CLEAR_CONSOLE) console.clear()

  for (const {method, args} of logs) {
    const styleArgs = []
    if (method in presets) {
      // @ts-ignore
      styleArgs.push('%c%s', presets[method], ` ${method.toLocaleUpperCase()} `)
    }
    const resultArgs = styleArgs.concat(args)
    switch (method) {
      case 'log':
      case 'warn':
        console.log(...resultArgs)
        break
      default:
        // @ts-ignore
        console[method](...resultArgs)
        break
    }
  }
  // @ts-ignore
  if (Config.PRINT_IN_GROUP) console.groupEnd('runtime')
}
