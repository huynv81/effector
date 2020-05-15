import React from 'react'
import ReactDOM from 'react-dom'
import {Application} from './application'

const root = document.querySelector('#try-wrapper')

if (!root) {
  throw new Error('Root element not found')
}

window.addEventListener(
  'touchmove',
  event => {
    event.preventDefault()
  },
  {passive: false},
)
root.addEventListener(
  'touchmove',
  (event: Event) => {
    event.stopPropagation()
  },
  false,
)

ReactDOM.render(<Application />, root)
