import { rejectByTimeout } from '../src/common'

jest.spyOn(global, 'setTimeout')

const flushPromises = () =>
  new Promise((resolve) => {
    process.nextTick(resolve)
  })

afterEach(() => {
  jest.clearAllTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('RejectByTimout should work', () => {
  it('RejectByTimout should throw right message', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve(), 100)
    })
    const context = 'hello'
    await expect(rejectByTimeout(promise, 0, context)).rejects.toThrow(
      `[${context}] Service or another peer not responding more than 0 ms`
    )
  })

  it('RejectByTimout should works with default timeout ', async () => {
    jest.useFakeTimers()
    const context = 'hello'
    const promise = new Promise(() => {})
    const wrappedPromise = rejectByTimeout(promise, undefined, context)
    jest.advanceTimersByTime(5100)
    await flushPromises()
    await expect(wrappedPromise).rejects.toThrow(
      `[${context}] Service or another peer not responding more than 5000 ms`
    )
  })

  it('RejectByTimout should works without context ', async () => {
    jest.useFakeTimers()
    const promise = new Promise(() => {})
    const wrappedPromise = rejectByTimeout(promise)
    jest.advanceTimersByTime(5100)
    await flushPromises()

    await expect(wrappedPromise).rejects.toThrow(
      `Service or another peer not responding more than 5000 ms`
    )
  })

  it('RejectByTimeout resolve promise', async () => {
    const promise = new Promise((resolve) => {
      resolve('OK')
    })
    const context = 'hello'
    await expect(rejectByTimeout(promise, 100, context)).resolves.toBe('OK')
  })
})
