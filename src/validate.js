import React from 'react'
import assign from 'object-assign'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './lib/get-component-name'

const getValidationErrors = (rules, model) => rules.reduce((errors, [rule, err]) => {
  return !rule(model)
    ? errors.concat(typeof err === 'function' ? err(model) : err)
    : errors
}, [])

const validate = (rules) => (WrappedComponent) => {
  const validated = (props) => {
    const validationErrors = getValidationErrors(rules, props.model)

    return React.createElement(WrappedComponent, assign({}, props, {
      isValid: !validationErrors.length,
      validationErrors,
    }))
  }
  validated.displayName = `Validate(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(validated, WrappedComponent)
}

export default validate
