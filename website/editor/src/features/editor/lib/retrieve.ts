import defaultVersions from '~/versions.json'
import {setCurrentShareId} from '~/features/share'

import {changeSources} from '../model'
import {defaultSourceCode} from './default-source-code'
import {compress, decompress} from './compression'

interface Preloaded {
  code: string
  description: string
  tags: string[]
}

export function retrieveCode(): string | null {
  const isStuck = readStuckFlag()
  const isAuthRedirectedUrl = location.pathname === '/auth'
  const regExp = new RegExp(`${location.origin}/(.*)`)
  const [, slug] = regExp.exec(location.href)

  const isProdDomain =
    /https:\/\/(.+\.)?effector\.dev/.test(location.origin) ||
    /^https:\/\/effector\.now\.sh$/.test(location.origin)

  if (isProdDomain) {
    if ('__code__' in window) {
      const preloaded = (window as any).__code__ as Preloaded
      if (slug) setCurrentShareId(slug)
      return preloaded.code
    }
  } else if (!isAuthRedirectedUrl) {
    if (slug && /^[a-zA-Z0-9]{8}$/.test(slug)) {
      fetch(`https://effector-proxy.now.sh/api/get-code?slug=${slug}`).then(
        async res => {
          try {
            const {status, data} = await res.json()
            if (status === 200) {
              const {code} = JSON.parse(decompress(data))
              return changeSources(code)
            }
          } catch (e) {
            console.error(e)
          }
        },
      )
      setCurrentShareId(slug)
      return null
    }
  }

  const code = getUrlParameter('code')
  if (!isAuthRedirectedUrl && code) {
    return decompress(code)
  }
  const storageCode = localStorage.getItem('code-compressed')
  if (storageCode != null) {
    const decompressed = decompress(storageCode)
    if (isStuck) {
      const withThrow = `throw Error('this code leads to infinite loop')\n${decompressed}`
      localStorage.setItem('code-compressed', compress(withThrow) || '')
      return withThrow
    }
    return decompressed
  }
  return defaultSourceCode
}

function readStuckFlag() {
  try {
    let flag = JSON.parse(localStorage.getItem('runtime/stuck')!)
    if (typeof flag !== 'boolean') flag = false
    localStorage.setItem('runtime/stuck', JSON.stringify(false))
    return flag
  } catch (err) {
    return false
  }
}

export function retrieveVersion(): string {
  const version = getUrlParameter('version')
  if (version) {
    return version
  }
  return defaultVersions[0]
}

function getUrlParameter(name: string): string | null {
  const urlSearch = new URLSearchParams(location.search)
  if (urlSearch.has(name)) return urlSearch.get(name)
  return ''
}
