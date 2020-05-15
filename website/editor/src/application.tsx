import React from 'react'
import {createMediaQuery} from './lib/media-query'

export const Application: React.FC = () => <></>

const SmallScreens = createMediaQuery('(max-width: 699px)')
const DesktopScreens = createMediaQuery('(min-width: 700px)')
