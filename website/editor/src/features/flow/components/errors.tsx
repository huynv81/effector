import * as React from 'react'
import {styled} from 'linaria/react'
import {useList} from 'effector-react'

import {$typeErrors} from '../model'
import {FlowMessage, FlowInfoTree} from '../types'

export const TypeErrorsView = () => (
  <TypeErrors>
    <Scroll>
      <ul>
        {useList($typeErrors, error => {
          // TODO: hide libdefs until errors are fixed
          if (
            process.env.NODE_ENV === 'production' &&
            error.message[0].loc?.type === 'LibFile'
          )
            return null

          return (
            <li>
              {error.message.map((message, key) => (
                <ErrorMessage key={key} {...message} />
              ))}
              {error.extra &&
                error.extra.map((extra, key) => <Extra key={key} {...extra} />)}
            </li>
          )
        })}
      </ul>
    </Scroll>
  </TypeErrors>
)

const ErrorMessage = ({type, loc, context, descr}: FlowMessage) => {
  if (loc && loc.source != null && context != null) {
    const basename = loc.source.replace(/.*\//, '')
    //$todo
    const filename = basename !== 'repl.js' ? `${loc.source}:` : ''
    const prefix = `${filename}${loc.start.line}: `

    const before = context.slice(0, loc.start.column - 1)
    const highlight =
      loc.start.line === loc.end.line
        ? context.slice(loc.start.column - 1, loc.end.column)
        : context.slice(loc.start.column - 1)
    const after =
      loc.start.line === loc.end.line ? context.slice(loc.end.column) : ''

    const offset = loc.start.column + prefix.length - 1
    const arrow = `${(prefix + before).replace(/[^ ]/g, ' ')}^ `

    return (
      <>
        <div>
          {prefix + before}
          <strong className="msgHighlight">{highlight}</strong>
          {after}
        </div>
        {arrow}
        <span className="msgType">{descr}</span>
      </>
    )
  } else if (type === 'Comment') {
    return <>{`. ${descr}\n`}</>
  } else {
    return <>{`${descr}\n`}</>
  }
}

const Extra = ({message, children}: FlowInfoTree) => (
  <ul>
    {message && (
      <li>
        {message.map((message, key) => (
          <ErrorMessage key={key} {...message} />
        ))}
      </li>
    )}
    {children && (
      <li>
        {children.map((extra, key) => (
          <Extra key={key} {...extra} />
        ))}
      </li>
    )}
  </ul>
)

const TypeErrors = styled.pre`
  display: flex;
  margin: 0;
  position: static;
  font-size: 80%;
  font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  border-left: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  padding: 7px 10px;
  grid-column: 3 / span 1;
  grid-row: 3 / span 2;

  @media (max-width: 699px) {
    grid-column: 1 / span 1;
    grid-row: 3 / span 7;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li + li {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #eee;
  }
`

const Scroll = styled.div`
  display: flex;
  overflow: auto;
`
