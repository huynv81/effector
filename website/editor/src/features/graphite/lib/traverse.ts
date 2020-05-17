import {Cmd} from '../types'

export type NoopCmd = Cmd | {type: 'noop'}

export function traverseGraphite(commands: Cmd[] | Cmd): NoopCmd[] | NoopCmd {
  if (Array.isArray(commands)) {
    return commands.map(traverseCmd)
  }
  return traverseCmd(commands)
}

function traverseCmd(cmd: Cmd): NoopCmd {
  switch (cmd.type) {
    case 'barrier':
      return {
        id: cmd.id,
        type: cmd.type as 'barrier',
        group: cmd.group,
        data: cmd.data,
      }
    case 'update':
      return {
        id: cmd.id,
        type: cmd.type as 'update',
        group: cmd.group,
        data: cmd.data,
      }
    case 'run':
      return {
        id: cmd.id,
        type: cmd.type as 'run',
        group: cmd.group,
        data: cmd.data,
      }
    case 'filter':
      return {
        id: cmd.id,
        type: cmd.type as 'filter',
        group: cmd.group,
        data: cmd.data,
      }
    case 'emit':
      return {
        id: cmd.id,
        type: cmd.type as 'emit',
        group: cmd.group,
        data: cmd.data,
      }
    case 'compute':
      return {
        id: cmd.id,
        type: cmd.type as 'compute',
        group: cmd.group,
        data: cmd.data,
      }
    case 'tap':
      return {
        id: cmd.id,
        type: cmd.type as 'tap',
        group: cmd.group,
        data: cmd.data,
      }
    default:
      return {type: 'noop'}
  }
}
