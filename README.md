# Reformed (Name Pending)

Deadly simple form bindings for React so you can stop storing your form data in local component state. This higher-order component wraps your component and, through props, injects form data (a "model") and simple bindings to update that model, giving you the opportunity to utilize composition to accomplish more advanced functionality without bloating your form component.

There is no framework here, it's about 100 lines of code that you could write yourself in a few minutes. The code is not what is important. My goal is to encourage developers to stop using local state in their forms, and do so without locking themselves into a prescriptive, and potentially monolithic, form library. There are some _really_ cool things you can do with simple composition, and this project is an attempt to shine some light on those alternative approaches.

This library does not concern itself with submission, validation, or anything of that sort -- it's just a simple read/write API, and isn't even all that specific to forms. Everybody's forms are different, and I'm not smart enough to create a universal abstraction. As such, over time, I've found it easy to encapsulate the core logic of a form (setting properties on a model) in a single component and leverage composition to perform more intricate functionality.

## Table of Contents

1. [Rationale](#rationale)
1. [Examples](#examples)
1. [API Documentation](#api-documentation)

## Rationale

Controlled components are great; they allow you to perform realtime validation (read: prior to submission), transform user inputs on the fly, track changes over time, and generally improve developer and user experience. However, often times controlled components lead to a proliferation of local component state. You begin tracking validation states (should we be validating yet? Are we performing asynchronous operations?), submission states, and more. Before you know it, a small form component is a sizeable tangle of local state. What happens when something else needs access to that state? How do you incorporate shared validation logic?

Some solutions use refs, others offer bindings onto _local_ state, and still more tout a Comprehensive Form Solution, but none of them feel right. Either they do too much, are too prescriptive, or just get in the way.

With the approach offered here, because everything important to your form now lives in props, you can easily:

* Track/store/replay changes to your model over time
* Compose higher-order components (sync to local storage, validate your form, etc.)
* Spy or stub all `setModel`/`setProperty`/etc. calls in testing
* Avoid becoming locked into a specific framework

And, most importantly, eliminate local component state as much as possible.

## Examples

### Simple Form

```js
import reformed from 'reformed'

class MyForm extends React.Component {
  _onSubmit = (e) => {
    e.preventDefault()
    this.props.onSubmit(this.props.model)
  }

  render () {
    const { model, bindInput, bindToChangeEvent } = this.props

    return (
      <form onSubmit={this._onSubmit}>
        <input {...bindInput('firstName')} />
        <input {...bindInput('lastName')} />
        <input {...bindInput('dob', 'date')} />
        <textarea
          name='bio'
          rows='5'
          onChange={bindToChangeEvent}
        />
        <hr />
        {JSON.stringify(model, null, 2)}
      </form>
    )
  }
}

// Wrap your form in the higher-order component
export default reformed()(MyForm)
```

### Fast Prototypes

This library provides some simple bindings to speed up form creation. These are for convenience only; you can get by with just `setProperty` and `setModel` if you'd like. I encourage you to write your own abstractions over these core setters.

```js
import reformed from 'reformed'

// "model" and "bindInput" both come from reformed
export const MyForm = ({ bindInput }) => {
  <form onSubmit={/* ... */}>
    <input {...bindInput('name')} />        {/* "type" attribute defaults to "text" */}
    <input {...bindInput('dob', 'date')} /> {/* but you can override it if necessary */}
    <button type='submit'>Submit</button>
  </form>
)

// Then, use it just like you would in any other component
class Main extends React.Component {
  _onSubmit = (model) => {
    // do something...
  }

  render () {
    <MyForm
      initialModel={{ firstName: 'Michael', lastName: 'Scott' }} // provide an initial model if you want
      submit={this._onSubmit}
    />
  }
}

export default Main
```

## Advanced Uses

Here are just some ideas to get you thinking about what's possible when you stop isolating form data in local state and allow it to flow through props. These example are not necessarily production-ready, as they are simply meant as conceptual demonstrations.

### Tracking Changes

The model is never mutated, so it's easy to check when it's been changed.

```js
// You could easily expand this to implement time travel
const tracker = (WrappedComponent) => {
  class Tracker extends React.Component {
    constructor (props, ctx) {
      super(props, ctx)
      this.state = {
        history: [],
      }
    }

    componentWillMount () {
      if (this.props.model) {
        this.addToHistory(this.props.model)
      }
    }

    componentWillReceiveProps (nextProps) {
      if (this.props.model !== nextProps.model) {
        this.addToHistory(nextProps.model)
      }
    }

    addToHistory = (model) => {
      this.setState({ history: this.state.history.concat(model) })
    }

    render () {
      return React.createElement(WrappedComponent, {
        ...this.props,
        history: this.state.history,
      })
    }
  }
  return Tracker
}

compose(
  reformed(),
  tracker,
)(YourFormComponent)
```

### Form Validation

This is an ultra-simple higher-order component for synchronous form validation. It is in no way specific to this library, all it does is expected a `model` prop and apply additional `isValid` and `validationErrors` props based on how the model conforms to the validation rules.

```js
// treats `rules` as a tuple of [validator: Function, validationError: string]
// `validationError` could easily be a function, if you wanted, for more
// advanced error messages.
const validate = (rules) => (WrappedComponent) => {
  const getValidationErrors = (model) => rules.reduce((errors, [rule, err]) => {
    return !rule(model) ? errors.concat(err) : errors
  }, [])

  return (props) => {
    const validationErrors = getValidationErrors(props.model)

    React.createElement(WrappedComponent, {
      ...props,
      isValid: !validationErrors.length,
      validationErrors,
    })
  }
}

const isRequired = (prop) => ([
  (model) => !!model[prop],
  `${prop} is a required field.`
])
const mustBeAtLeast = (prop, val) => ([
  (model) => model[prop] >= val,
  `${prop}` must be at least `${val}`
])

compose(
  reformed(),
  validate([
    isRequired('firstName'),
    isRequired('lastName'),
    mustBeAtLeast('age', 18),
  ])
)(YourFormComponent)
```

### With Redux

```js

// easily set initial form state from your redux store...
// and bind a submission handler while you're at it.
compose(
  connect(
    (state) => ({ model: state.forms.myInitialFormModel }),
    { submit: mySubmitFunction }
  ),
  reformed(),
)(YourFormComponent)
```

### Local Storage

This, again, is a simplified example. You could very easily implement a
debounce or throttle function to limit how often the data is written
to local storage.

```js
const syncAs = (storageKey) => (WrappedComponent) => {
  class SyncedComponent extends React.Component {
    componentWillMount () {
      const fromStorage = localStorage.getItem(storageKey)
      if (fromStorage) {
        // probably want to try/catch this in a real app
        this.props.setModel(JSON.parse(fromStorage))
      }
    }

    componentWillReceiveProps (nextProps) {
      if (this.props.model !== nextProps.model) {
        localStorage.setItem(storageKey, JSON.stringify(nextProps.model))
      }
    }

    // or, maybe you only want to sync when the component is unmounted
    componentWillUnmount () {
      localStorage.setItem(storageKey, JSON.stringify(this.props.model))
    }

    render () {
      React.createElement(WrappedComponent, this.props)
    }
  }
  // hoist statics, wrap name, etc.
  return SyncedComponent
}

compose(
  reformed(),
  syncAs('my-form-state')
)(YourFormComponent)
```

### Storage - Abstracted

Notice anything interesting about the local storage example? It's not at all specific to local storage...

```js
const syncWith = (key, get, set) => (WrappedComponent) => {
  class SyncedComponent extends React.Component {
    componentWillMount () {
      const fromStorage = get(storageKey, this.props)
      if (fromStorage) {
        this.props.setModel(fromStorage)
      }
    }

    // When we call `set` we can easily provide the current props as a
    // third argument. This would be useful, for example, with other
    // higher-order components such as react-redux.
    componentWillReceiveProps (nextProps) {
      if (this.props.model !== nextProps.model) {
        set(key, nextProps.model, nextProps)
      }
    }

    render () {
      React.createElement(WrappedComponent, this.props)
    }
  }
  // ...
  return SyncedComponent
}

compose(
  reformed(),
  syncWith(
    'my-form',
    (key) => JSON.parse(localStorage.getItem(key)),
    (key, value) => localStorage.setItem(key, JSON.stringify(value))
  )
)(MyFormComponent)
```

## API Documentation

### `reformed : (Object -> Object) -> ReactComponent -> ReactComponent`

### `setProperty : String -> * -> Object`

### `setModel : Object -> Object`

### `bindInput : String -> Object`
