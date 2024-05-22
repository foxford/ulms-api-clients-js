import retry from '../src/retry'

const resolvedData = {}
const error = new Error('example error')
const taskThatResolves = () => Promise.resolve(resolvedData)
const taskThatRejects = () => Promise.reject(error)
const taskThatThrows = () => {
  throw error
}
const taskThatResolvesAfter = (n) => {
  let count = 0

  return () => {
    count += 1

    if (count < n) {
      return taskThatRejects()
    }

    return taskThatResolves()
  }
}

describe('retry', () => {
  it('resolves when task resolves', async () => {
    await expect(retry(taskThatResolves)).resolves.toBe(resolvedData)
  })

  it('rejects when task rejects', async () => {
    await expect(retry(taskThatRejects)).rejects.toBe(error)
  })

  it('rejects when task throws', async () => {
    await expect(retry(taskThatThrows)).rejects.toBe(error)
  })

  it('resolves when task resolves after 2 calls', async () => {
    const task = taskThatResolvesAfter(2)

    await expect(retry(task)).resolves.toBe(resolvedData)
  })

  it('onRetry have not been called', async () => {
    const onRetry = jest.fn()

    await expect(retry(taskThatResolves, onRetry)).resolves.toBe(resolvedData)

    expect(onRetry).not.toHaveBeenCalled()
  })

  it('onRetry have been called 2 times', async () => {
    const onRetry = jest.fn()

    await expect(retry(taskThatRejects, onRetry)).rejects.toBe(error)

    expect(onRetry).toHaveBeenCalledTimes(2)
  })
})
