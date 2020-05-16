import {createEffect, attach, Effect} from 'effector'
import {GITHUB_API_URL} from './config'
import {BadTokenError, UnauthorizedError} from './errors'
import {$githubToken} from './state'

interface Query {
  query: string
  variables: Record<string, any>
  token: string | null
}

const request = createEffect<
  Query,
  any,
  BadTokenError | UnauthorizedError | Error
>()

const authorizedRequest = attach({
  effect: request,
  source: $githubToken,
  mapParams: ({query, variables}, token) => ({
    query,
    variables,
    token,
  }),
})

const createRequest = (query: string) =>
  attach({
    effect: authorizedRequest,
    mapParams: (variables: Record<string, any> | void = {}) => ({
      query,
      variables,
    }),
  })

export const getUserInfoFx = createRequest(graphql`
  query userInfo {
    viewer {
      databaseId
      avatarUrl(size: 64)
      name
      url
    }
  }
`)

request.use(async ({query, variables, token}) => {
  if (!token) throw new BadTokenError()
  const res = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!res.ok) {
    throw new UnauthorizedError()
  }

  return await res.json()
})

// Just for syntax highlighting in the IDE
function graphql(chunks: TemplateStringsArray) {
  return chunks.join('')
}
