import {createEvent, createStore} from 'effector'

import * as Realm from '~/features/realm'
import {traverseGraphite, NoopCmd} from './lib/traverse'
import {Cmd, kind, Graph, CompositeName} from './types'

export const resetGraphiteState = createEvent()

interface Reset {
  __shouldReset?: boolean
}

export const $graphite = createStore<Record<string, Cmd[]> & Reset>({})

export const $graphiteCode = $graphite.map(graphite => {
  const result: Record<string, NoopCmd[] | NoopCmd> = {}
  for (const key in graphite) {
    result[key] = traverseGraphite(graphite[key])
  }
  return JSON.stringify(result, null, 2)
})

interface Unit {
  kind: kind
  id: string
  compositeName?: CompositeName
  shortName?: string
  graphite: Graph
}

$graphite
  .on([Realm.event, Realm.store, Realm.effect], invokeSetter)
  .on(resetGraphiteState, graphite => {
    graphite.__shouldReset = true
    return graphite
  })

function invokeSetter(
  state: Record<string, Cmd[]> & Reset,
  unit: Unit,
): Record<string, Cmd[]> & Reset {
  let result
  if (state.__shouldReset === true) result = {}
  else result = {...state}
  const key = `${unit.kind} '${unit.compositeName?.fullName ??
    unit.shortName ??
    unit.id}'`
  result[key] = unit.graphite.seq
  return result
}
