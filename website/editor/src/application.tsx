import React from 'react'
import {useStore} from 'effector-react'

import {Outline} from './ui/outline'

import {createMediaQuery} from './lib/media-query'

import {codeSetCursor} from './features/editor'
import {$stats} from './features/realm'

export const Application: React.FC = () => (
  <>
    <OutlinePanel />
  </>
)

const SmallScreens = createMediaQuery('(max-width: 699px)')
const DesktopScreens = createMediaQuery('(min-width: 700px)')

const OutlinePanel = () => {
  const stats = useStore($stats)
  return <Outline onItemClick={codeSetCursor} {...stats} />
}
