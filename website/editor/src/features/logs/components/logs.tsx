import * as React from 'react'
import {useStore} from 'effector-react'

import {$autoScrollLogs} from '~/features/settings'
import {$logs} from '../model'
import {Console, Styles} from '../lib/console'

interface Logs {
  style?: Styles
}

export const Logs: React.FC<Logs> = ({style}) => {
  const logs = useStore($logs)
  const autoScroll = useStore($autoScrollLogs)

  return (
    <Console
      className="console"
      style={style}
      logs={logs}
      autoScroll={autoScroll}
    />
  )
}
