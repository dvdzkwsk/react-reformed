import React from 'react'
import assign from 'object-assign'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './_internal/getComponentName'

const makeWrapper = (middleware) => (WrappedComponent) => {
  class FormWrapper extends React.Component {
    static propTypes = {
      initialModel: PropTypes.object,
    }

    constructor (props, ctx) {
      super(props, ctx)
      this.state = {
        model: props.initialModel || {},
      }
    }

    setModel = (newModel) => {
      const model = typeof middleware === 'function'
        ? middleware(newModel, this.props)
        : newModel

      this.setState({ model })
      return model
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

    bindInput = (name, type = 'text') => {
      return {
        name,
        type,
        value: this.state.model[name],
        onChange: this.bindToChangeEvent,
      }
    }

    render () {
      const props = assign({}, this.props, {
        bindInput: this.bindInput,
        bindToChangeEvent: this.bindToChangeEvent,
        model: this.state.model,
        setProperty: this.setProperty,
        setModel: this.setModel,
      })

      return React.createElement(WrappedComponent, props)
    }
  }

  FormWrapper.displayName = `Form(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(FormWrapper, WrappedComponent)
}

export default makeWrapper
