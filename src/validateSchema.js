import React from 'react'
import assign from 'object-assign'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './_internal/getComponentName'

const getAllValidationErrors = (schema, props, prevResults) => {
  const fields = Object.keys(schema).reduce((acc, key) => {
    const result = getValidationErrorsForProp(schema, props, key, prevResults)
    if (!result) return acc
    return assign({}, acc, { [key]: result })
  }, prevResults.fields)

  // Calculate aggregate flags
  const anyTrue = (prev, curr) => prev === true ? true : curr
  const anyFalse = (prev, curr) => prev === false ? false : curr
  const aggregators = {
    isValid: anyFalse,
    dirty: anyTrue,
    pristine: anyFalse,
    touched: anyTrue,
    untouched: anyFalse
  }

  const form = Object.keys(fields).reduce((acc, key) => {
    Object.keys(aggregators).map(flag => {
      acc[flag] = aggregators[flag](acc[flag], fields[key][flag])
    })
    return acc
  }, {})

  return {
    isValid: form.isValid,
    form,
    fields
  }
}

const getValidationErrorsForProp = (schema, props, key, prevResults) => {
  const errors = []
  const { model, lastInputEvent, inputFlags } = props
  const prevResult = prevResults.fields[key] || {}
  const value = model[key]
  const rules = schema[key]
  const flags = inputFlags[key] || {}
  const updateOn = rules.updateOn || 'change'

  const isPristine = (flags.pristine)
  const isRelatedEvent = (lastInputEvent.name === key)
  const isValidEventType = (lastInputEvent.type === updateOn)
  const isCurrentlyInvalid = (prevResult.isValid === false)
  const isFirstEvaluation = (key in prevResults.fields === false)

  const shouldValidate = (
    isPristine ||
    ( isRelatedEvent && (isValidEventType || isCurrentlyInvalid) )
  )

  if (shouldValidate === false) {
    return (isFirstEvaluation)
      ? { isValid: true, errors: [], ...flags }
      : assign({}, prevResult, flags)
  }

  const ctx = { key, value, rules, schema, model }

  const renderError = (condition, fallback) => {
    return typeof rules.formatError === 'function'
      ? rules.formatError({ ...ctx, condition })
      : fallback
  }

  if (rules.required && !value) {
    errors.push(renderError('required', `${key} is required`))
  }
  if (rules.type && typeof value !== rules.type) {
    errors.push(renderError('type', `${key} must be of type ${rules.type}, but got ${typeof value}`))
  }
  if (rules.minLength) {
    if (!value || value.length < rules.minLength) {
      errors.push(renderError('minLength', `${key} must have at least ${rules.minLength} characters`))
    }
  }
  if (rules.maxLength) {
    if (value && value.length > rules.maxLength) {
      errors.push(renderError('maxLength', `${key} must not have more than ${rules.maxLength} characters`))
    }
  }
  if (rules.test) {
    let error
    rules.test(value, (msg) => {
      error = msg
    }, ctx)
    if (error) {
      errors.push(error)
    }
  }

  return {
    isValid: !errors.length,
    errors,
    ...flags
  }
}

const validateSchema = (schema) => (WrappedComponent) => {
  let cachedSchema = {
    isValid: true,
    form: {},
    fields: {}
  }

  const validated = (props) => {
    cachedSchema = getAllValidationErrors(schema, props, cachedSchema)
    return React.createElement(WrappedComponent, assign({}, props, {
      schema: cachedSchema
    }))
  }
  validated.displayName = `ValidateSchema(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(validated, WrappedComponent)
}

export default validateSchema
