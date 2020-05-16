import React from 'react'
import ReactDOM from 'react-dom'
import {styled} from 'linaria/react'
import {useStore} from 'effector-react'

import {DropDownArrow, GithubCatIcon, LoadingIcon} from '~/ui/icons'

import {config} from '../config'
import {$csrf, $githubToken, $githubUser} from '../state'
import {getUserInfoFx} from '../api'
import {authFx, logout} from '../model'

const portalContainer = document.getElementById('auth-section')!

export const GithubHeaderButton = () => {
  const token = useStore($githubToken)
  const userInfo = useStore($githubUser)
  const userInfoPending = useStore(getUserInfoFx.pending)
  const authPending = useStore(authFx.pending)
  // config.githubAuthUrl.searchParams.set('redirect_uri', location.href)

  if (authPending || userInfoPending) {
    return ReactDOM.createPortal(
      <div
        style={{
          alignSelf: 'center',
          marginLeft: 40,
          // zIndex: 100,
          paddingRight: 40,
        }}>
        <LoadingIcon />
      </div>,
      portalContainer,
    )
  }

  if (token) {
    return <GitHubUserMenu user={userInfo} />
  } else {
    return <GitHubAuthLink token={token} />
  }
}

const GitHubUserMenu = ({user, pending, ...props}: any) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)

  const closeMenu = (event: MouseEvent) => {
    const {left, right, top, bottom} = ref.current!.getBoundingClientRect()
    if (
      event.pageX < left ||
      event.pageX > right ||
      event.pageY < top ||
      event.pageY > bottom
    ) {
      setOpen(false)
    }
  }

  React.useEffect(() => {
    open && window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [open])

  return ReactDOM.createPortal(
    <div
      style={{
        alignSelf: 'center',
        marginLeft: 40,
        alignItems: 'center',
        cursor: 'pointer',
        // zIndex: 100,
        paddingRight: 10,
        overflow: 'hidden',
        minWidth: 18,
        minHeight: 18,
        ...props.style,
      }}>
      <div
        style={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          ...props.style,
        }}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(state => !state)
        }}>
        <img
          src={user.avatarUrl}
          alt={user.name}
          style={{margin: '0 5px 0 0', width: 32, height: 32}}
        />
        <DropDownArrow />
      </div>
      <DropDownMenu data-open={open} ref={ref}>
        <a
          style={{
            margin: '5px 20px 10px 20px',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
          }}
          href={user.url}
          target="_blank"
          rel="noreferrer noopener">
          <GithubCatIcon />
          <span style={{fontWeight: 'bold'}}>{user.name}</span>
        </a>
        <MenuDivider />
        <MenuItem
          onClick={() => {
            setOpen(false)
            logout()
          }}>
          Sign out
        </MenuItem>
      </DropDownMenu>
    </div>,
    portalContainer,
  )
}

const GitHubAuthLink = ({
  token,
  ...props
}: {
  token: string | null
  style?: object
}) => {
  return ReactDOM.createPortal(
    <a
      href="#"
      // target="_blank"
      {...props}
      style={{
        alignSelf: 'center',
        marginLeft: 40,
        // zIndex: 100,
        paddingRight: 10,
        ...props.style,
      }}
      onClick={e => {
        e.preventDefault()
        const csrf = Math.random().toString(36)
        // @ts-ignore
        $csrf.setState(csrf)
        config.githubAuthUrl.searchParams.set('state', csrf)
        console.log(config.githubAuthUrl.href)
        location.replace(config.githubAuthUrl.href)
      }}>
      <GithubCatIcon /> Sign in
    </a>,
    portalContainer,
  )
}

const DropDownMenu = styled.div`
  transform-origin: top right;
  transform: scale(0) translateX(-100px);
  transition: transform 0.2s;
  border: 1px solid #ccc;
  position: absolute;
  top: calc(100% + 10px);
  z-index: 101;
  right: -14px;
  background-color: white;
  color: #333;
  box-shadow: 2px 2px 12px #999;
  padding: 5px 0px;
  border-radius: 5px;
  &::after {
    opacity: 0;
    transition: opacity 0.3s;
    content: '';
    position: absolute;
    border: 10px solid transparent;
    border-bottom-color: white;
    top: -20px;
    right: 30px;
    left: auto;
  }

  &[data-open='true'] {
    transform: scale(1) translateX(0px);
    &::after {
      opacity: 1;
    }
  }
`

const MenuItem = styled.div`
  padding: 5px 20px;
  transition: background-color 0.25s, color 0.25s;
  background-color: transparent;
  color: #333;
  &:hover {
    background-color: var(--primary-color);
    color: white;
  }
`

const MenuDivider = styled.div`
  height: 1px;
  border: none;
  background-color: #eee;
`
