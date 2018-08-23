import React from 'react'
import PropTypes from 'prop-types'
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

    setModel = (model) => {
      this.setState({ model })
      return model
    }

    setProperty = (prop, value) => {
      return this.setModel(assign({}, this.state.model, {
        [prop]: value,
      }))
    }

    makeInputHelpers = ({ setProperty }) => {
      // This, of course, does not handle all possible inputs. In such cases,
      // you should just use `setProperty` or `setModel`. Or, better yet,
      // extend `reformed` to supply the bindings that match your needs.
      const bindToChangeEvent = (e) => {
        const { name, type, value } = e.target

        if (type === 'checkbox') {
          const oldCheckboxValue = this.state.model[name] || []
          const newCheckboxValue = e.target.checked
            ? oldCheckboxValue.concat(value)
            : oldCheckboxValue.filter(v => v !== value)

          setProperty(name, newCheckboxValue)
        } else {
          setProperty(name, value)
        }
      }

      const bindInput = (name) => {
        return {
          name,
          value: this.state.model[name] || '',
          onChange: bindToChangeEvent,
        }
      }

      return { bindToChangeEvent, bindInput }
    }

    render () {
      let nextProps = assign({}, this.props, {
        model: this.state.model,
        setProperty: this.setProperty,
        setModel: this.setModel,
      })

      // SIDE EFFECT-ABLE. Just for developer convenience and expirementation.
      if (typeof middleware === 'function') {
        nextProps = middleware(nextProps)
      }

      // Create input helpers (`bindInput`, `bindToChangeEvent`) and merge
      // them into the final props.
      // The middleware can replace `setProperty`, so the helpers can't
      // reference it until we have the final version.
      const finalProps = assign({}, this.makeInputHelpers(nextProps), nextProps)

      return React.createElement(WrappedComponent, finalProps)
    }
  }

  FormWrapper.displayName = `Reformed(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(FormWrapper, WrappedComponent)
}

export default makeWrapper
