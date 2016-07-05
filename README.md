# React Reformed

Tiny form bindings for React so you can stop storing your form data in local component state. This higher-order component wraps your component and, through props, injects form data (a "model") and simple bindings to update that model, giving you the opportunity to utilize composition to accomplish more advanced functionality without bloating the form component itself.

There is no framework here, it's about 75 lines of code that you could write yourself in a few minutes. The code is not what is important. My goal is to encourage developers to stop using local state in their forms, and do so without locking themselves into a prescriptive, and potentially monolithic, form library. There are some _really_ cool things you can do with simple composition, and this project is an attempt to shine some light on those alternative approaches.

This library does not concern itself with submission, validation, or anything of that sort -- it's just a simple read/write API, and isn't even all that specific to forms. Everybody's forms are different, and I'm not smart enough to create a universal abstraction. As such, over time, I've found it easy to encapsulate the core logic of a form (setting properties on a model) in a single component and leverage composition to perform more intricate functionality.

[Try it out in this JSFiddle sandbox.](https://jsfiddle.net/465qszsx/4/)

## Table of Contents

1. [Rationale](#rationale)
1. [Usage](#usage)
1. [Examples](#examples)
1. [API Documentation](#api-documentation)

## Rationale

Controlled components are great, they allow you to perform realtime validation, transform user inputs on the fly, track changes over time, and generally improve developer and user experience. However, often times controlled components lead to a proliferation of local component state. You begin tracking validation states (should we be validating yet? Are we performing asynchronous operations?), submission states, and more. Before you know it, a small form component is a sizeable tangle of local state. What happens when something else needs access to that state? How do you incorporate shared validation logic?

Some libraries solve this with refs, others offer bindings onto _local_ state, and still more tout a Comprehensive Form Solution with their own components and validation systems, but none of them feel right. Either they do too much, are too prescriptive, or just get in the way. Chances are, at some point these libraries will no longer fit your use case, forcing you to fight against rather than work with them. That is why this is not another library, but instead an appeal to a different way of thinking.

With the approach offered here, because everything important to your form now lives in props, you can easily:

* Eliminate or reduce local component state
* Compose higher-order components as "middleware" (e.g. form validation)
* Serialize and rehydrate form state
* Replay changes to your model over time
* Change what the injected model setters do, without changing the form itself
* Spy or stub all `setModel`/`setProperty`/etc. calls in testing
* Avoid becoming locked into a specific framework

Most importantly, this approach allows for a pluggable/composeable ecosystem, rather than a One Solution To Rule Them All ([_but will soon change_](https://xkcd.com/927/)) approach.

## Usage

```
npm i --save react-reformed
```

Then just import it and wrap your form component:

```js
import React from 'react'
import reformed from 'react-reformed'

export class YourForm extends React.Component {
  /* ... */
}

export default reformed()(YourForm)
```

You can also grab some of the example higher-order components via the npm package. These are just for demonstration, so they are not included in the main export. Use them just to give yourself some ideas!

```js

import compose from 'react-reformed/lib/compose'
import syncWith from 'react-reformed/lib/syncWith'
import validate from 'react-reformed/lib/validate'
```

## Examples

### Basic Form

Here's an example of a form that closely resembles basic form implementations that rely on `this.state`, but uses the form bindings instead.

```js
import reformed from 'react-reformed'

class MyForm extends React.Component {
  _onSubmit = (e) => {
    e.preventDefault()
    this.props.onSubmit(this.props.model)
  }

  // this method is essentially just `this.props.bindToChangeEvent`,
  // which is provided by the reformed wrapper. We're just demoing
  // `setProperty` for clarity in the first example.
  _onChangeInput = (e) => {
    // `setProperty` is injected by `reformed`
    this.props.setProperty(e.target.name, e.taget.value)
  }

  render () {
    const { model } = this.props

    return (
      <form onSubmit={this._onSubmit}>
        <input name='firstName' onChange={this._onChangeInput} />
        <input name='lastName' onChange={this._onChangeInput} />
        <input name='dob' type='date' onChange={this._onChangeInput} />
        <button type='submit'>Submit</button>
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
import reformed from 'react-reformed'

// "model" and "bindInput" both come from reformed
const MyForm = ({ bindInput }) => {
  <form onSubmit={/* ... */}>
    <input type='text' {...bindInput('name')} />
    <input type='date' {...bindInput('dob')} />
    <textarea {...bindInput('bio')} />
    <button type='submit'>Submit</button>
  </form>
)

const MyFormContainer = reformed()(MyForm)

// Then, use it just like you would in any other component
class Main extends React.Component {
  _onSubmit = (model) => {
    // do something...
  }

  render () {
    return (
      <MyFormContainer
        initialModel={{ firstName: 'Michael', lastName: 'Scott' }} // provide an initial model if you want
        submit={this._onSubmit}
      />
    )
  }
}
```

## Advanced Uses

Here are just some ideas to get you thinking about what's possible when you stop isolating form data in local state and allow it to flow through props. These example are not necessarily production-ready, as they are simply meant as conceptual demonstrations.

### Form Validation

This is an ultra-simple higher-order component for synchronous form validation. It is in no way specific to this library, all it does is expected a `model` prop and apply additional `isValid` and `validationErrors` props based on how the model conforms to the validation rules.

#### How It Might Look
```js
compose(
  reformed(),
  validate([
    isRequired('firstName'),
    isRequired('lastName'),
    mustBeAtLeast('age', 18)
  ])
)(YourFormComponent)
```

You could totally go above and beyond and implement something like this:

```js
compose(
  reformed(),
  validateSchema({
    firstName: {
      type: 'string',
      required: true
    },
    lastName: {
      type: 'string',
      required: true
    },
    age: {
      test: (value) => {
        return age && age > 18
      }
    }
  })
)(YourFormComponent)
```

And no matter what you choose to do, your _form never changes_.

#### Example Implementation
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

    return React.createElement(WrappedComponent, {
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
  `${prop} must be at least ${val}`
])
```

### Tracking Changes

The model is never mutated, so it's easy to check when it's been changed.

#### How It Might Look
```js
compose(
  reformed(),
  tracker
)(YourFormComponent)
```

#### Example Implementation
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
```

### With Redux

#### How It Might Look
```js
// Easily set initial form state from your redux store...
// and bind a submission handler while you're at it.
compose(
  reformed(),
  connect(
    (state) => ({ initialModel: state.forms.myForm.cachedModel }),
    { onSubmit: mySubmitFunction }
  ),
)(YourFormComponent)
```

If you want to persist your form in Redux over time, you don't even need `reformed`. By following its pattern of simple model setters, you can just fulfill the same interface with `connect` and have a redux-ified form without importing another entire library. And if you switch to something else down the road you won't need to unreduxify the form, just its container.

```js
connect(
  (state) => ({ model: state.form.myForm.model }),
  (dispatch) => ({
    setProperty: (prop, value) => dispatch(setFormProperty('myForm', prop, value)),
    // etc...
  })
)(YourFormComponent)
```

### Local Storage

This, again, is a simplified example. You could very easily implement a debounce or throttle function to limit how often the data is written to local storage.

#### How It Might Look
```js
compose(
  reformed(),
  syncAs('my-form-state')
)(YourFormComponent)
```

#### Example Implementation
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
      return React.createElement(WrappedComponent, this.props)
    }
  }
  // hoist statics, wrap name, etc.
  return SyncedComponent
}
```

### Storage - Abstracted

Notice anything interesting about the local storage example? It's not at all specific to local storage...

#### How It Might Look
```js
compose(
  reformed(),
  syncWith(
    'my-form',
    (key) => JSON.parse(localStorage.getItem(key)),
    (key, value) => localStorage.setItem(key, JSON.stringify(value))
  )
)(MyFormComponent)
```

#### Example Implementation
```js
const syncWith = (key, get, set) => (WrappedComponent) => {
  class SyncedComponent extends React.Component {
    componentWillMount () {
      const fromStorage = get(key, this.props)
      if (fromStorage) {
        this.props.setModel(fromStorage)
      }
    }

    // When we call `set` we can provide the current props as a
    // third argument. This would be useful, for example, with other
    // higher-order components such as react-redux.
    componentWillReceiveProps (nextProps) {
      if (this.props.model !== nextProps.model) {
        set(key, nextProps.model, nextProps)
      }
    }

    render () {
      return React.createElement(WrappedComponent, this.props)
    }
  }
  // ...
  return SyncedComponent
}
```

## API Documentation

### `reformed : (Props -> Props) -> ReactComponent -> ReactComponent`
Wraps a React component and injects the form model and setters for that model.

Example:
```js
class YourForm extends React.Component {
  /* ... */
}

reformed()(YourForm)
```

### `setProperty : (String k, v) -> {k:v}`
**Injected by the `reformed` higher order component.** Allows you to set a specific property on the model.

Example:
```js
this.props.setProperty('firstName', 'Billy')
```

### `setModel : {k:v} -> {k:v}`
**Injected by the `reformed` higher order component.** Allows you to completely override the model.

Example:
```js
this.props.setModel({
  firstName: 'Bob',
  lastName: 'Loblaw'
})
```

### `bindInput : String k -> Object`
**Injected by the `reformed` higher order component.** Applies `name`, `value`, and `onChange` properties to the input element.

Example:
```js
<input {...this.props.bindInput('firstName') />
```
