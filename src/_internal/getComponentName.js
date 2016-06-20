const getComponentName = (component) => (
  component.displayName ||
  component.name
)

export default getComponentName
