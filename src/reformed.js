import React from 'react'
import assign from 'object-assign'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './_internal/getComponentName'

const makeWrapper = (middleware) => (WrappedComponent) => {
  class FormWrapper extends React.Component {
    static propTypes = {
      initialModel: React.PropTypes.object,
    }

    constructor (props, ctx) {
      super(props, ctx)
      this.state = {
        model: props.initialModel || {},
      }
    }

    setModel = (model) => {
      this.setState({ model })
    }

    setProperty = (prop, value) => {
      return this.setModel(assign({}, this.state.model, {
        [prop]: value,
      }))
    }

    bindToChangeEvent = (e) => {
      let value
      switch (e.target.type) {
        case 'checkbox':
          value = e.target.checked
          break
        default:
          value = e.target.value
      }

      this.setProperty(e.target.name, value)
    }

    bindInput = (name) => {
      return {
        name,
        value: this.state.model[name],
        onChange: this.bindToChangeEvent,
      }
    }

    render () {
      const nextProps = assign({}, this.props, {
        bindInput: this.bindInput,
        bindToChangeEvent: this.bindToChangeEvent,
        model: this.state.model,
        setProperty: this.setProperty,
        setModel: this.setModel,
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
