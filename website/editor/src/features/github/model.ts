import {createEffect, createEvent, createStore} from 'effector'
import {GITHUB_GATEKEEPER_URL} from './config'
import {$githubToken, $githubUser} from './state'
import {getUserInfoFx} from './api'

export const login = createEvent()
export const logout = createEvent()
export const setToken = createEvent<string | null>()

export const authFx = createEffect<void, any>()

$githubUser
  .on(getUserInfoFx.doneData, (_, payload) => payload['data']['viewer'])
  .reset(getUserInfoFx.fail, logout, login)

$githubToken
  .on(setToken, (_, token) => token)
  .reset(getUserInfoFx.fail, logout, login)

if (location.pathname === '/auth') {
  authFx()
}

authFx.use(async() => {
  const params = new URLSearchParams(location.search)
  const code = params.get('code')

  if (code) {
    const url = new URL(GITHUB_GATEKEEPER_URL)
    url.searchParams.set('code', code)

    try {
      const response = await fetch(url.toString())
      if (response.ok) {
        const {token} = await response.json()

        setToken(token)
        history.replaceState({}, '', location.origin)
      }
    } catch (error) {
      return setToken(null)
    }
  }

  getUserInfoFx()
})
