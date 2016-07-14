export default function compose (..._fns) {
  return (...args) => {
    const [fn, ...fns] = _fns.reverse()
    return fns.reduce((acc, f) => f(acc), fn(...args))
  }
}
