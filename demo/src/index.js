import cx from 'classnames'
import React from 'react'
import ReactDOM from 'react-dom'
// These imports are aliased to ~/src, so you are welcome to mess with
// the source code :)
import reformed from 'react-reformed'
import compose from 'react-reformed/lib/compose'
import syncWith from 'react-reformed/lib/syncWith'
import validateSchema from 'react-reformed/lib/validateSchema'

/*
 * Here you can create your base form component.
 * Look at how small and sleek it is.
 */
const MyForm = ({ bindInput, bindCheckbox, model, onSubmit, setProperty, schema }) => {
  const sampleCheckboxOptions = ['foo', 'bar', 'baz']
  const submitHandler = (e) => {
    e.preventDefault()
    onSubmit(model)
  }
  const isUsernameValid = schema.fields.username.untouched || schema.fields.username.isValid
  const isPasswordValid = schema.fields.password.untouched || schema.fields.password.isValid

  return (
    <form onSubmit={submitHandler}>
      <fieldset className={cx('form-group', { 'has-danger': !isUsernameValid })}>
        <label htmlFor='username'>Username</label>
        <input
          type='text'
          className='form-control'
          placeholder='Username'
          {...bindInput('username')}
        />
      </fieldset>
      <fieldset className={cx('form-group', { 'has-danger': !isPasswordValid })}>
        <label htmlFor='password'>Password</label>
        <input
          type='text'
          className='form-control'
          placeholder='Password'
          {...bindInput('password')}
        />
      </fieldset>
      <fieldset className='form-group'>
        {sampleCheckboxOptions.map(value => (
          <div key={value} className='checkbox-inline'>
            <label>
              <input
                type='checkbox'
                name='checkboxes'
                value={value}
                {...bindCheckbox('checkboxes', value)}
              />
              {' '}{value}
            </label>
          </div>
        ))}
      </fieldset>
      <button type='submit' className='btn btn-primary' disabled={!schema.isValid}>
        View Source Code
      </button>
    </form>
  )
}

/*
 * Let's build our form's container component. We can save all or parts of
 * this composition so that it can be reused across the application once you
 * figure out what is general to the application!
 *
 * Here we'll apply some simple validation rules and also configure our form
 * to sync to local storage.
 */
const createFormContainer = compose(
  reformed(),
  // Let's try out some schema validation...
  validateSchema({
    username: {
      required: true,
      maxLength: 8,
      updateOn: 'blur',
      // note: you can optionally generate custom errors via `formatError`
      // by providing a string or a function that receives context
      formatError: (context) => {
        // e.g. return a message id for use with `react-intl` or similar
        return `errors.username.${context.condition}`;
      }
    },
    password: {
      // note: my `test` implementation is super basic, `fail` can
      // only be used synchronously. Write your own to suit your needs!
      test: (value, fail) => {
        if (!value || value.length < 5) {
          return fail('Password must be at least 5 characters')
        } else if (value.length > 12) {
          return fail('Password must be no longer than 12 characters')
        }
      }
    }
  }),
  // And while we're at it, we can make our form sync to local storage.
  syncWith(
    'myForm',
    (key) => JSON.parse(localStorage.getItem(key)),
    (key, value) => localStorage.setItem(key, JSON.stringify(value))
  ),
)

/**
 * Oh, yeah, that `createFormContainer` is just a function... so we can
 * always just compose it alongside other functions. Let's write a
 * generic HoC to display our form state below it.
 */
const displayFormState = (WrappedComponent) => {
  return (props) => {
    return (
      <div>
        {React.createElement(WrappedComponent, props)}
        <hr />
        <h4>Model</h4>
        <pre>{JSON.stringify(props.model, null, 2)}</pre>
        <hr />
        <h4>Schema Validation</h4>
        <pre>{JSON.stringify(props.schema, null, 2)}</pre>
      </div>
    )
  }
}

/*
 * Time to create our final form component... this is what you'd
 * ultimately export from your component definition if you had a
 * real application structure.
 *
 * And hey, Look at that, a totally composed form that displays
 * its model, syncs to local storage, and does some basic
 * validation in less than 100 lines of component-specific code.
 */
const MyFormContainer = compose(
  createFormContainer,
  displayFormState
)(MyForm)

/*
 * And... render our form.
 */
class App extends React.Component {
  _onSubmit = (model) => {
    window.location = 'https://github.com/davezuko/react-reformed/blob/master/demo/src/index.js'
  }

  render () {
    return (
      <div className='container' style={{ marginTop: '2rem' }}>
        <div className='row'>
          <div className='col-sm-8 col-sm-offset-2'>
            <h1>React Reformed</h1>
            <h2>Make forms <del>great</del> simple again.</h2>
            <p>
              This form also syncs your state to local storage...<br/>
              Try reloading the page after entering some information.<br/>
            </p>
            <MyFormContainer
              onSubmit={this._onSubmit}
              initialModel={{ checkboxes: [] }}
            />
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, window.root)
