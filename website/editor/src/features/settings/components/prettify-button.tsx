import * as React from 'react'
import {useStoreMap} from 'effector-react'
import {styled} from 'linaria/react'

import {clickPrettify, prettierFx} from '../model'
import {LoadingIcon} from '~/ui/icons'

export const PrettifyButton = () => {
  const {disabled, pending} = useStoreMap({
    store: prettierFx.pending,
    keys: [],
    fn: pending => ({
      disabled: pending,
      pending,
    }),
  })
  return (
    <Button
      disabled={disabled}
      onClick={clickPrettify}
      style={{
        padding: 0,
        flex: '0 0 100px',
        height: 28,
        lineHeight: 0,
        margin: '0 10px 0 3px',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        justifyContent: 'center',
      }}>
      {pending && <LoadingIcon style={{marginRight: 10}} />}
      Prettify
    </Button>
  )
}

const Button = styled.button`
  --color-main: #e95801;
  margin: var(--settings-row-padding);

  display: inline-block;
  border: none;
  border-radius: 3px;
  border-width: 0;
  padding: 0.5rem 1rem;
  text-decoration: none;
  background: var(--color-main);
  color: #ffffff;
  font-family: sans-serif;
  //font-size: 1rem;
  cursor: pointer;
  text-align: center;
  transition: background 70ms ease-in-out, transform 150ms ease;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:hover,
  &:focus {
    background: #0053ba;
  }

  &:focus {
    outline: 1px solid #fff;
    outline-offset: -4px;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: hsl(213, 50%, 45%);
    color: hsla(0, 0%, 100%, 0.9);
    cursor: not-allowed;
  }
`
