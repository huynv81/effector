import * as React from 'react'
import {Event, Effect, createEvent, createEffect} from 'effector'

import CM, {Annotation} from 'codemirror'
import '../lib/codemirror-jsx'

import 'codemirror/addon/lint/lint.css'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/wrap/hardwrap'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
import 'codemirror/keymap/sublime'
import 'codemirror/addon/fold/foldgutter.css'

import {checkContentFx} from '~/features/flow'

const {signal, Pos} = CM

interface Props {
  autoCloseBrackets?: boolean
  className?: string
  codeSample?: string
  lineNumbers?: boolean
  lineWrapping?: boolean
  lint?: any
  markLine?: Effect<any, any, any>
  matchBrackets?: boolean
  mode?: any
  onChange?: (value: string) => void
  onCursorActivity?: (editor: CM.Editor) => void
  passive?: boolean
  performLint?: Event<any>
  readOnly?: boolean
  ref?: React.Ref<any>
  setCursor?: Event<any>
  showCursorWhenSelecting?: boolean
  style?: object
  tabSize?: number
  value: string
}

export class CodeMirror extends React.Component<Props> {
  _textareaRef = React.createRef<HTMLTextAreaElement>()
  _codeMirror: CM.EditorFromTextArea | null = null
  _cached = ''

  componentDidMount() {
    const {
      style,
      value,
      onChange,
      codeSample,
      lineNumbers = true,
      tabSize = 2,
      showCursorWhenSelecting = true,
      autoCloseBrackets = true,
      matchBrackets = true,
      className = '',
      lineWrapping = false,
      passive = false,
      setCursor = createEvent<any>(),
      markLine = createEffect<any, any, any>(),
      performLint = createEvent<void>(),
      onCursorActivity = () => {},
      ...props
    } = this.props
    const options = {
      foldGutter: true,
      tabSize: 2,
      dragDrop: false,
      keyMap: 'sublime',
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      lint: {
        getAnnotations,
        lintOnChange: true,
      },
      ...props,
    }

    this._codeMirror = CM.fromTextArea(this._textareaRef.current!, options)
    this._codeMirror.on('change', this.handleChange)
    this._codeMirror.on('focus', this.handleFocus)
    this._codeMirror.on('cursorActivity', this.props.onCursorActivity!)

    CM.on(this._codeMirror.getWrapperElement(), 'mouseover', (event: any) => {
      const target = event.target || event.srcElement
      const box = target.getBoundingClientRect(),
        x = (box.left + box.right) / 2,
        y = (box.top + box.bottom) / 2
      // @ts-ignore
      const pos = this._codeMirror.coordsChar({left: x, top: y}, 'client')
      // console.log(pos)
    })

    this._codeMirror.setValue((this._cached = this.props.value || ''))

    this.props.setCursor?.watch(({line, column}) => {
      const cm = this._codeMirror!
      cm.focus()
      cm.setCursor({line: line - 1, ch: column})
      const cursorCoords = cm.cursorCoords(
        {line: line - 1, ch: column},
        'local',
      )
      const scrollInfo = cm.getScrollInfo()
      cm.scrollTo(
        cursorCoords.left,
        cursorCoords.top - scrollInfo.clientHeight / 2,
      )
    })

    this.props.performLint?.watch(() => {
      // @ts-ignore
      this._codeMirror!.performLint()
    })

    this.props.markLine?.use(
      ({
        from,
        to = {
          line: from.line,
          ch: this._codeMirror!.getLine(from.line)?.length || from.ch,
        },
        options,
      }) => this._codeMirror!.markText(from, to, options),
    )
  }

  componentWillUnmount() {
    this._codeMirror && this._codeMirror.toTextArea()
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value !== this._cached && this.props.value != null) {
      this.updateValue(this.props.value)
    }
    if (this.props.mode !== prevProps.mode && this.props.mode != null) {
      this._codeMirror?.setOption('mode', this.props.mode)
    }
  }

  updateValue(value: any) {
    this._cached = value
    if (this.props.passive) {
      this._codeMirror?.setValue(value)
    }
  }

  handleFocus = (/* codeMirror, event */) => {
    if (this._codeMirror?.getValue() === this.props.codeSample) {
      this._codeMirror?.execCommand('selectAll')
    }
  }

  handleChange = (doc: any, change: any) => {
    //console.log('change.origin', change.origin);
    if (change.origin !== 'setValue') {
      this._cached = doc.getValue()
      this.props.onChange?.(this._cached)
    }
  }

  render() {
    const {className} = this.props
    return (
      <div className={'editor ' + className}>
        <textarea ref={this._textareaRef} />
      </div>
    )
  }
}

function getAnnotations(
  text: string,
  callback: CM.UpdateLintingCallback,
  options: CM.LintStateOptions,
  editor: CM.Editor,
) {
  checkContentFx(text)
    .then(({code}) => (code === 'fail' ? [] : code))
    .then(errors => {
      signal(editor, 'flowErrors', errors)

      const lint = errors.map(err => {
        const messages = err.message
        const firstLoc = messages[0].loc
        const message = messages.map(msg => msg.descr).join('\n')
        return {
          from: Pos(firstLoc!.start.line - 1, firstLoc!.start.column - 1),
          to: Pos(firstLoc!.end.line - 1, firstLoc!.end.column),
          severity: err.level,
          message,
        }
      })
      // @ts-ignore
      callback(lint)
    })

  CM.fromTextArea
}
getAnnotations.async = true
