import * as React from 'react'
import {useStore} from 'effector-react'

import {$graphiteCode} from '../model'
import {CodeMirror} from './codemirror'

const jsonRef = React.createRef<any>()

export const Graphite: React.FC<{style?: object}> = ({style}) => {
  const code = useStore($graphiteCode)

  return (
    <CodeMirror
      className="results graphite"
      style={style}
      readOnly={true}
      lint={null}
      passive
      lineWrapping={false}
      ref={jsonRef}
      value={code}
      mode="application/json"
    />
  )
}
