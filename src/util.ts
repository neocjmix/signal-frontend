export const invoke = (func: () => any) => func()

export const noop = () => {
}

export const throwError = (e: Error) => {
  throw e
};

