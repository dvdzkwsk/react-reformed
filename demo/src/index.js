import React from 'react'
import ReactDOM from 'react-dom'
// These imports are aliased to ~/src, so you are welcome to mess with
// their source code :)
import reformed from 'react-reformed'
import compose from 'react-reformed/lib/compose'
import syncWith from 'react-reformed/lib/syncWith'
import validate, { isRequired } from 'react-reformed/lib/validate'

/*
 * Here you can create your base form component.
 *
 * Look at how small and sleek it is.
 */
const MyForm = ({ bindInput, model, onSubmit }) => {
  const submitHandler = (e) => {
    e.preventDefault()
    onSubmit(model)
  }

  return (
    <form onSubmit={submitHandler}>
      <fieldset className='form-group'>
        <label htmlFor='firstName'>First Name</label>
        <input
          type='text'
          className='form-control'
          placeholder='First Name'
          {...bindInput('firstName')}
        />
      </fieldset>
      <fieldset className='form-group'>
        <label htmlFor='lastName'>Last Name</label>
        <input
          type='text'
          className='form-control'
          placeholder='Last Name'
          {...bindInput('lastName')}
        />
      </fieldset>
      <button type='submit' className='btn btn-primary'>Submit</button>
    </form>
  )
}

/*
 * Let's build our form's container component. We can save our composition so
 * that it can be re-used across the application once you figure out what
 * your needs are!
 *
 * Here, we'll apply some simple validation rules and also configure our form
 * to sync to local storage.
 */
const createFormContainer = compose(
  reformed(),
  validate([
    isRequired('firstName'),
    isRequired('lastName'),
  ]),
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
        {JSON.stringify(props.model, null, 2)}
      </div>
    )
  }
}

/*
 * Time to create our final form component... this is what you'd
 * ultimately export if you had a real application structure.
 * And hey, Look at that, a totally composed form that displays
 * its model, syncs to * local storage, and does some basic
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
    // noop
  }

  render () {
    return (
      <div className='container' style={{ marginTop: '2rem' }}>
        <h1>React Reformed</h1>
        <h2>Make forms <del>great</del> simple again.</h2>
        <MyFormContainer onSubmit={this._onSubmit} />
      </div>
    )
  }
}

ReactDOM.render(<App />, window.root)
