import React from 'react'
import {createStore, createEvent} from 'effector'
import {useStore} from 'effector-react'

export function createMediaQuery(query: string): React.ComponentType {
  const mediaQuery = window.matchMedia(query)
  const queryChanged = createEvent<MediaQueryListEvent>()
  const $isQueryMatches = createStore(mediaQuery.matches)

  mediaQuery.addListener(queryChanged)
  $isQueryMatches.on(queryChanged, (_, event) => event.matches)

  const MediaQuery: React.FC = ({children}) => {
    const matches = useStore($isQueryMatches)

    if (matches) {
      return <>{children}</>
    }

    return null
  }

  MediaQuery.displayName = `MediaQuery(${query})`

  return MediaQuery
}
