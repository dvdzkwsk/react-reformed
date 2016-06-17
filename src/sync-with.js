import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import getComponentName from './lib/get-component-name'

const syncWith = (key, get, set) => (WrappedComponent) => {
  class SyncedComponent extends React.Component {
    componentWillMount () {
      const fromStorage = get(key, this.props)
      if (fromStorage) {
        this.props.setModel(fromStorage)
      }
    }

    componentWillReceiveProps (nextProps) {
      if (this.props.model !== nextProps.model) {
        set(key, nextProps.model, nextProps)
      }
    }

    render () {
      return React.createElement(WrappedComponent, this.props)
    }
  }
  SyncedComponent.displayName = `Synced(${getComponentName(WrappedComponent)})`
  return hoistNonReactStatics(SyncedComponent, WrappedComponent)
}

export default syncWith
