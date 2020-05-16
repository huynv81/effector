import * as React from 'react'
import * as stdPath from 'path'
import {createEffect, createStore, Effect} from 'effector'
import PluginEffectorReact from 'effector/babel-plugin-react'
import PluginBigInt from '@babel/plugin-syntax-bigint'

import {
  selectVersion,
  $version,
  $sourceCode,
  $compiledCode,
} from '~/features/editor'
import {$typeChecker} from '~/features/settings'
import {consoleMap} from '~/features/logs'
import * as Realm from '~/features/realm'

import {prepareRuntime} from './lib/prepare'
import {exec} from './lib/runtime'
import {readStackFrames} from './lib/stack'

const tag = `# source`
const $filename = createStore('repl.js')

$filename.on($typeChecker, (_, typechecker) => {
  if (typechecker === 'typescript') return 'repl.ts'
  return 'repl.js'
})

async function createRealm(
  sourceCode: string,
  filename: string,
  additionalLibs: Record<string, any> = {},
): Promise<Record<string, any>> {
  const realm: Record<string, any> = {}
  realm.process = {env: {NODE_ENV: 'development'}}
  realm.require = (path: string) => {
    switch (path) {
      case 'symbol-observable':
        return Symbol.observable
      case 'path':
        return stdPath
      case 'react':
        return React
    }
    if (path in additionalLibs) return additionalLibs[path]
    console.warn('require: ', path)
  }
  realm.exports = {}
  realm.module = {exports: realm.exports}
  realm.console = consoleMap()
  await exec({
    code: `'use strict'; ${sourceCode}\n//${tag}URL=${filename}`,
    realmGlobal: getIframe().contentWindow,
    globalBlocks: [realm],
    onRuntimeError,
    compile: false,
    filename,
  })
  return realm.module.exports || realm.exports
}

const modulesCache: Record<string, Map<string, any>> = {
  effector: new Map(),
  '@effector/babel-plugin': new Map(),
}

const fetchEffectorFx = createEffect({
  async handler(ver: string) {
    const url =
      ver === 'master'
        ? 'https://effector--canary.s3-eu-west-1.amazonaws.com/effector/effector.cjs.js'
        : `https://unpkg.com/effector@${ver}/effector.cjs.js`
    const sourceMap = `${url}.map`
    const req = await fetch(url)
    let text = await req.text()
    text = text.replace(
      /\/\/\# sourceMappingURL\=.*$/m,
      `//${tag}MappingURL=${sourceMap}`,
    )
    return createRealm(text, `effector.${ver}.js`)
  },
})

fetchEffectorFx.fail.watch(() => selectVersion('master'))

const fetchBabelPluginFx = createEffect<string, Record<string, any>, unknown>(
  'fetch babel plugin',
  {
    async handler(ver) {
      const url =
        ver === 'master'
          ? 'https://effector--canary.s3-eu-west-1.amazonaws.com/@effector/babel-plugin/index.js'
          : `https://unpkg.com/@effector/babel-plugin@latest/index.js`
      const sourceMap = `${url}.map`
      const req = await fetch(url)
      let text = await req.text()
      text = text.replace(
        /\/\/\# sourceMappingURL\=.*$/m,
        `//${tag}MappingURL=${sourceMap}`,
      )
      return createRealm(text, `effector-babel-plugin.${ver}.js`)
    },
  },
)

const fetchEffectorReactFx = createEffect<any, Record<string, any>, unknown>(
  'fetch effector-react',
  {
    async handler(effector) {
      const url =
        'https://effector--canary.s3-eu-west-1.amazonaws.com/effector-react/effector-react.cjs.js'
      const sourceMap = `${url}.map`
      const req = await fetch(url)
      let text = await req.text()
      text = text.replace(
        /\/\/\# sourceMappingURL\=.*$/m,
        `//${tag}MappingURL=${sourceMap}`,
      )
      return createRealm(text, `effector-react.cjs.js`, {effector})
    },
  },
)

const fetchEffectorDomFx = createEffect({
  async handler(effector: any) {
    const url =
      'https://effector--canary.s3-eu-west-1.amazonaws.com/effector-dom/effector-dom.cjs.js'
    const sourceMap = `${url}.map`
    const req = await fetch(url)
    let text = await req.text()
    text = text.replace(
      /\/\/\# sourceMappingURL\=.*$/m,
      `//${tag}MappingURL=${sourceMap}`,
    )
    return createRealm(text, `effector-dom.cjs.js`, {effector})
  },
})
const fetchEffectorForkFx = createEffect({
  async handler(effector: any) {
    const url =
      'https://effector--canary.s3-eu-west-1.amazonaws.com/effector/fork.js'
    const sourceMap = `${url}.map`
    const req = await fetch(url)
    let text = await req.text()
    text = text.replace(
      /\/\/\# sourceMappingURL\=.*$/m,
      `//${tag}MappingURL=${sourceMap}`,
    )
    return createRealm(text, `fork.js`, {effector})
  },
})

const fetchEffectorReactSSRFx = createEffect({
  async handler(effector: any) {
    const url =
      'https://effector--canary.s3-eu-west-1.amazonaws.com/effector-react/ssr.js'
    const sourceMap = `${url}.map`
    const req = await fetch(url)
    let text = await req.text()
    text = text.replace(
      /\/\/\# sourceMappingURL\=.*$/m,
      `//${tag}MappingURL=${sourceMap}`,
    )
    return createRealm(text, `ssr.js`, {effector})
  },
})

fetchBabelPluginFx.fail.watch(() => selectVersion('master'))

const apiEffects: Record<string, Effect<any, Record<string, any>, any>> = {
  effector: fetchEffectorFx,
  'effector/fork': fetchEffectorForkFx,
  '@effector/babel-plugin': fetchBabelPluginFx,
  'effector-dom': fetchEffectorDomFx,
}

function cacher(
  version: string,
  cache: Map<string, any>,
  fetcher: Effect<any, Record<string, any>, any>,
) {
  const cached = cache.get(version)
  if (cached) return cached
  const req = fetcher(version)
  cache.set(version, req)
  return req
}

export const $versionLoader = $version.map(version => {
  const data: Record<string, any> = {}
  for (const key in modulesCache) {
    data[key] = cacher(version, modulesCache[key as any], apiEffects[key])
  }
  return data
})

export async function evaluator(code: string) {
  Realm.statusApi.init()
  const [babelPlugin, effector] = await Promise.all([
    modulesCache['@effector/babel-plugin'].get($version.getState()),
    modulesCache.effector.get($version.getState()),
  ])
  const effectorReact = await fetchEffectorReactFx(effector)
  let effectorDom
  let effectorFork
  let effectorReactSSR
  if ($version.getState() === 'master') {
    const additionalLibs = await Promise.all([
      fetchEffectorDomFx(effector),
      fetchEffectorForkFx(effector),
      fetchEffectorReactSSRFx(effector),
    ])
    effectorDom = additionalLibs[0]
    effectorFork = additionalLibs[1]
    effectorReactSSR = additionalLibs[2]
  }
  //$off
  const env = prepareRuntime(
    effector,
    effectorReact as any,
    $version.getState(),
  )
  return exec({
    code,
    realmGlobal: getIframe().contentWindow,
    globalBlocks: [
      env,
      {dom: effectorDom, effectorDom, effectorFork, effectorReactSSR},
    ],
    filename: $filename.getState(),
    types: $typeChecker.getState() || 'typescript',
    pluginRegistry: {
      'effector/babel-plugin': babelPlugin,
      'effector/babel-plugin-react': PluginEffectorReact,
      'syntax-bigint': PluginBigInt,
      '@effector/repl-remove-imports': removeImportsPlugin,
    },
    onCompileError(error) {
      Realm.statusApi.fail()
      console.error('Babel ERR', error)
      throw {type: 'babel-error', original: error, stackFrames: []}
    },
    onRuntimeError,
    onCompileComplete(compiled, config) {
      // @ts-ignore
      $compiledCode.setState(compiled)
    },
    onRuntimeComplete() {
      Realm.statusApi.done()
    },
  })
}

const onRuntimeError = async (error: Error) => {
  Realm.statusApi.fail()
  console.error('Runtime ERR', error)
  const stackFrames = await readStackFrames(error)
  throw {type: 'runtime-error', original: error, stackFrames}
}
function replaceModuleImports(
  globalVarName: string,
  path: any,
  {types: t}: any,
) {
  const values = []
  for (const specifier of path.node.specifiers) {
    switch (specifier.type) {
      case 'ImportSpecifier':
        values.push(
          t.objectProperty(
            t.identifier(specifier.imported.name),
            t.identifier(specifier.local.name),
          ),
        )
        break
      case 'ImportNamespaceSpecifier':
      case 'ImportDefaultSpecifier':
        path.replaceWith(
          t.VariableDeclaration('const', [
            t.VariableDeclarator(
              t.identifier(specifier.local.name),
              t.memberExpression(
                t.identifier('globalThis'),
                t.identifier(globalVarName),
              ),
            ),
          ]),
        )
        return
    }
  }
  path.replaceWith(
    t.VariableDeclaration('const', [
      t.VariableDeclarator(
        t.objectPattern(values),
        t.memberExpression(
          t.identifier('globalThis'),
          t.identifier(globalVarName),
        ),
      ),
    ]),
  )
}
const removeImportsPlugin = (babel: any) => ({
  visitor: {
    ImportDeclaration(path: any) {
      switch (path.node.source.value) {
        case 'effector-dom':
          replaceModuleImports('effectorDom', path, babel)
          break
        case 'effector/fork':
          replaceModuleImports('effectorFork', path, babel)
          break
        case 'effector-react/ssr':
          replaceModuleImports('effectorReactSSR', path, babel)
          break
        default:
          path.remove()
      }
    },
    ExportDefaultDeclaration(path: any) {
      path.remove()
    },
    ExportNamedDeclaration(path: any) {
      if (path.node.declaration) {
        path.replaceWith(path.node.declaration)
      } else {
        path.remove()
      }
    },
  },
})

let iframe: HTMLIFrameElement | null = null

function getIframe(): HTMLIFrameElement {
  if (iframe === null) {
    iframe =
      ((document.getElementById('dom') as any) as HTMLIFrameElement | null) ||
      document.createElement('iframe')
    const wrapListenerMethods = (target: any) => {
      if (!target) return
      if (!target.addEventListener.__original__) {
        const originalMethod = target.addEventListener.bind(target)
        // @ts-ignore
        function addEventListener(type: string, fn: Function, options: any) {
          originalMethod(type, fn, options)
          Realm.listener({type, target, fn, options})
        }
        ;(addEventListener as any).__original__ = originalMethod
        target.addEventListener = addEventListener
      }
      if (!target.removeEventListener.__original__) {
        const originalMethod = target.removeEventListener.bind(target)
        // @ts-ignore
        function removeEventListener(type, fn, options) {
          originalMethod(type, fn, options)
          Realm.listenerRemove({type, target, fn, options})
        }
        ;(removeEventListener as any).__original__ = originalMethod
        target.removeEventListener = removeEventListener
      }
    }
    const generateFrame = () => {
      if (!iframe?.contentDocument?.body) return

      resetHead(iframe.contentDocument)
      iframe.contentDocument.body.innerHTML =
        '<div class="spectrum spectrum--lightest spectrum--medium" id="root"></div>'
      //wrapListenerMethods(iframe.contentDocument)
      //wrapListenerMethods(iframe.contentWindow)
      //wrapListenerMethods(iframe.contentDocument.body)
      //wrapListenerMethods(iframe.contentDocument.documentElement)
    }
    $sourceCode.watch(generateFrame)
    selectVersion.watch(generateFrame)
  }

  return iframe
}

function resetHead(document: Document) {
  const styleLinks = [
    'https://unpkg.com/@adobe/spectrum-css@2.x/dist/spectrum-core.css',
    'https://unpkg.com/@adobe/spectrum-css@2.x/dist/spectrum-lightest.css',
  ]
  for (const node of document.head.childNodes) {
    if (node.nodeName === 'LINK') {
      const href = (node as Element).getAttribute('href')!
      const rel = (node as Element).getAttribute('rel')

      if (rel === 'stylesheet' && styleLinks.includes(href)) {
        styleLinks.splice(styleLinks.indexOf(href), 1)
        continue
      }
    }
    node.remove()
  }

  for (const url of styleLinks) {
    const link = document.createElement('link')
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('href', url)
    document.head.appendChild(link)
  }
}
