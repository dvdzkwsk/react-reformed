export default function compose (..._fns) {
  const [fn, ...fns] = _fns.reverse()
  return (...args) => {
    return fns.reduce((acc, f) => f(acc), fn(...args))
  }
}
