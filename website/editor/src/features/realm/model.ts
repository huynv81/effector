import {
  createEvent,
  createStore,
  Domain,
  Effect,
  Event,
  is,
  split,
  Store,
  Unit,
} from 'effector'
import {StoreView} from 'effector-react'
import {selectVersion, changeSources} from '~/features/editor'

interface Listener {
  type: string
  target: any
  fn: Function
  options?: any
}

interface Stats {
  event: Event<any>[]
  store: Store<any>[]
  effect: Effect<any, any, any>[]
  domain: Domain[]
  component: StoreView<any, any>[]
}

const invoke = createEvent<{method: string; params: any[]; instance: any}>()
const status = createEvent<{active: boolean; throwError: boolean}>()
const statusApi = {
  init: status.prepend(() => ({active: true, throwError: false})),
  done: status.prepend(() => ({active: false, throwError: false})),
  fail: status.prepend(() => ({active: false, throwError: true})),
}

const {event, store, effect, domain} = split(
  invoke.map(event => event.instance ?? {}),
  {
    store: object => object.kind === 'store' || object.kind === 1,
    event: object => object.kind === 'event' || object.kind === 2,
    effect: object => object.kind === 'effect' || object.kind === 3,
    domain: object => object.onCreateDomain && object.domain,
  },
)

const interval = createEvent<NodeJS.Timeout>()
const intervalClear = createEvent<NodeJS.Timeout>()
const timeout = createEvent<NodeJS.Timeout>()
const timeoutClear = createEvent<NodeJS.Timeout>()
const listener = createEvent<Listener>()
const listenerRemove = createEvent<Listener>()
const clearNode = createEvent<Unit<any>>()
const component = createEvent<StoreView<any, any>>()

const $intervals = createStore<NodeJS.Timeout[]>([])
const $timeouts = createStore<NodeJS.Timeout[]>([])
const $listeners = createStore<Listener[]>([])
export const $stats = createStore<Stats>({
  event: [],
  store: [],
  effect: [],
  domain: [],
  component: [],
})

$listeners
  .on(listener, (list, record) => [...list, record])
  .on(listenerRemove, (list, {type, target, fn}) =>
    list.filter(record => {
      if (record.fn === fn && record.type === type && record.target === target)
        return false
      return true
    }),
  )
  .on(changeSources, listeners => {
    for (const {type, target, fn, options} of listeners) {
      target.removeEventListener.__original__(type, fn, options)
    }
    return []
  })
  .on(selectVersion, listeners => {
    for (const {type, target, fn, options} of listeners) {
      target.removeEventListener.__original__(type, fn, options)
    }
    return []
  })

$intervals
  .on(interval, (state, id) => [...state, id])
  .on(intervalClear, (state, removed) => state.filter(id => id !== removed))
  .on(changeSources, state => {
    for (const id of state) {
      global.clearInterval(id)
    }
    return []
  })
  .on(selectVersion, state => {
    for (const id of state) {
      global.clearInterval(id)
    }
    return []
  })

$timeouts
  .on(timeout, (state, id) => [...state, id])
  .on(timeoutClear, (state, removed) => state.filter(id => id !== removed))
  .on(changeSources, state => {
    for (const id of state) {
      global.clearTimeout(id)
    }
    return []
  })
  .on(selectVersion, state => {
    for (const id of state) {
      global.clearTimeout(id)
    }
    return []
  })

$stats
  .on(event, ({event, ...rest}, e) => {
    if (event.includes(e)) return
    return {
      ...rest,
      event: [...event, e],
    }
  })
  .on(store, ({store, ...rest}, e) => {
    if (store.includes(e)) return
    return {
      ...rest,
      store: [...store, e],
    }
  })
  .on(effect, ({effect, ...rest}, e) => {
    if (effect.includes(e)) return
    return {
      ...rest,
      effect: [...effect, e],
    }
  })
  .on(domain, ({domain, ...rest}, e) => {
    if (domain.includes(e)) return
    return {
      ...rest,
      domain: [...domain, e],
    }
  })
  .on(component, ({component, ...rest}, e) => {
    if (component.includes(e)) return
    return {
      ...rest,
      component: [...component, e],
    }
  })
  .on(status, (stats, {active}) => {
    if (!active) return stats
    return {
      event: [],
      store: [],
      effect: [],
      domain: [],
      component: [],
    }
  })
  .on(clearNode, (stats, unit) => {
    if (is.store(unit)) {
      return {
        ...stats,
        store: [...stats.store.filter(store => store !== unit)],
      }
    }
    if (is.event(unit)) {
      return {
        ...stats,
        event: [...stats.event.filter(event => event !== unit)],
      }
    }
    if (is.effect(unit)) {
      return {
        ...stats,
        effect: [...stats.effect.filter(effect => effect !== unit)],
      }
    }
    return stats
  })
  .reset(changeSources)
  .reset(selectVersion)

invoke.watch(({method, params, instance}) => {
  if (method === 'restore') {
    if (
      params.length > 0 &&
      (params[0].kind === 'event' ||
        params[0].kind === 'effect' ||
        params[0].kind === 'store')
    ) {
      store(instance)
    } else {
      //TODO seems like a bug: restore doesn't have to deal with object shapes
      for (const key in instance) {
        store(instance[key])
      }
    }
  }
  if (method === 'createApi') {
    for (const key in instance) {
      event(instance[key])
    }
  }
  if (method === 'createComponent') {
    component(instance)
  }
  if (method === 'clearNode') {
    clearNode(params[0])
  }
})

effect.watch(e => {
  event(e.done)
  event(e.fail)
})

domain.watch(domain => {
  domain.onCreateEvent((event: Event<any>) => {
    //TODO: wrong behaviour?
    if (getDomainName(event) !== domain.compositeName) return
    event(event)
  })
  domain.onCreateEffect((event: Effect<any, any, any>) => {
    //TODO: wrong behaviour?
    if (getDomainName(event) !== domain.compositeName) return
    effect(event)
  })
  domain.onCreateStore((event: Store<any>) => {
    //TODO: wrong behaviour?
    if (getDomainName(event) !== domain.compositeName) return
    store(event)
  })
  domain.onCreateDomain((event: Domain) => domain(event))
})
function getDomainName(unit: any) {
  if (unit.parent) return unit.parent.compositeName
  // before 20.9.0
  return unit.domainName
}

intervalClear.watch(id => {
  global.clearInterval(id)
})
timeoutClear.watch(id => {
  global.clearTimeout(id)
})
