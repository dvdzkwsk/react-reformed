export default function compose (...fns) {
  return function () {
    let i = fns.length - 1
    let res = fns[i--].apply(null, arguments)

    while (i >= 0) {
      res = fns[i--](res)
    }
    return res
  }
}
