import React from 'react'
import assign from 'object-assign'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './_internal/getComponentName'

const contains = (x, xs) => xs && !!~xs.indexOf(x)

const makeWrapper = (middleware) => (WrappedComponent) => {
  class FormWrapper extends React.Component {
    static propTypes = {
      initialModel: React.PropTypes.object,
    }

    constructor (props, ctx) {
      super(props, ctx)
      this.state = {
        model: props.initialModel || {},
        lastInputEvent: {}
      }

      // Store input interaction flags for the life of this
      // component outside of state, so they can be updated
      // during render
      this.inputFlags = {}
    }

    setModel = (model) => {
      this.setState({ model })
      return model
    }

    setProperty = (prop, value) => {
      return this.setModel(assign({}, this.state.model, {
        [prop]: value,
      }))
    }

    initInputFlags = (name) => {
      if (!this.inputFlags[name]) {
        this.setInputFlags(name, {
          dirty: false,
          pristine: true,
          touched: false,
          untouched: true
        })
      }
    }

    setInputFlags = (name, flags) => {
      const merged = assign({}, this.inputFlags[name], flags)
      const inverse = {
        pristine: !merged.dirty,
        untouched: !merged.touched
      }

      this.inputFlags[name] = assign({}, merged, inverse)
      return this.inputFlags
    }

    // This, of course, does not handle all possible inputs. In such cases,
    // you should just use `setProperty` or `setModel`. Or, better yet,
    // extend `reformed` to supply the bindings that match your needs.
    bindToChangeEvent = (e) => {
      const { name, type, value } = e.target
      const newFlags = { dirty: true }

      if (type === 'checkbox') {
        const oldCheckboxValue = this.state.model[name] || []
        const newCheckboxValue = e.target.checked
          ? oldCheckboxValue.concat(value)
          : oldCheckboxValue.filter(v => v !== value)

        newFlags.touched = true
        this.setProperty(name, newCheckboxValue)
      } else {
        this.setProperty(name, value)
      }

      this.setInputFlags(name, newFlags)
    }

    bindInput = (name) => {
      this.initInputFlags(name)
      return {
        name,
        value: this.state.model[name] || '',
        onChange: this.onInputEvent,
        onBlur: this.onInputEvent,
        onFocus: this.onInputEvent
      }
    }

    bindCheckbox = (name, value) => {
      this.initInputFlags(name)
      return {
        name,
        checked: contains(value, this.state.model[name]),
        onChange: this.onInputEvent,
        onBlur: this.onInputEvent,
        onFocus: this.onInputEvent
      }
    }

    onInputEvent = (e) => {
      const { target, type } = e
      const { name } = target
      const lastInputEvent = { name, target, type }

      this.setState({ lastInputEvent })
      if (type === 'change') this.bindToChangeEvent(e)
      if (type === 'blur') this.setInputFlags(name, { touched: true })
    }

    componentDidMount = () => {
      // Once downstream inputs are bound and `inputFlags`
      // has been set, force an update
      this.forceUpdate()
    }

    render () {
      const nextProps = assign({}, this.props, {
        bindInput: this.bindInput,
        bindCheckbox: this.bindCheckbox,
        bindToChangeEvent: this.bindToChangeEvent,
        model: this.state.model,
        setProperty: this.setProperty,
        setModel: this.setModel,
        lastInputEvent: this.state.lastInputEvent,
        inputFlags: assign({}, this.inputFlags)
      })
      // SIDE EFFECT-ABLE. Just for developer convenience and expirementation.
      const finalProps = typeof middleware === 'function'
        ? middleware(nextProps)
        : nextProps

      return React.createElement(WrappedComponent, finalProps)
    }
  }

  FormWrapper.displayName = `Reformed(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(FormWrapper, WrappedComponent)
}

export default makeWrapper
