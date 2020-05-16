import * as React from 'react'
import {styled} from 'linaria/react'
import {useStore} from 'effector-react'

import {$typeHoverToggle} from '~/features/settings'
import {$typeHints} from '../model'

export const TypeHintView = () => {
  const type = useStore($typeHints)
  const enabled = useStore($typeHoverToggle)
  return enabled ? null : <TypeHint>{type}</TypeHint>
}

const lineHeight = 1.5
const lines = 3

const TypeHint = styled.pre`
  border-top: 1px solid #ddd;
  border-left: 1px solid #ddd;
  line-height: ${lineHeight}em;
  max-height: ${lineHeight * lines}em;
  overflow: auto;
  font-family: monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: normal;
  padding: 0 4px;
  margin: 0;
`
