import { writable, derived } from 'svelte/store'
import { createDefaultNotification, withoutProps } from './utilities'

export const app = writable({
  version: null,
  dappId: null,
  networkId: null
})
export const accounts = writable([])
export const contracts = writable([])
export const transactions = writable([])
export const customNotifications = writable([])

export const notifications = derived(
  [transactions, customNotifications],
  ([$transactions, $customNotifications]) => {
    const transactionNotifications = $transactions
      .filter(transaction => transaction.notification)
      .map(transaction => transaction.notification)

    return [...transactionNotifications, ...$customNotifications].sort(
      (a, b) => a.timestamp - b.timestamp
    )
  }
)

export const styles = writable({
  mobilePosition: null,
  desktopPosition: null,
  darkMode: null,
  headlessMode: null,
  css: null
})

export const removeTransactionNotification = id =>
  transactions.update(store =>
    store.map(t => {
      if (t.id === id) {
        t.notification = null
      }

      return t
    })
  )

export const updateTransaction = (transaction, eventCode) => {
  setTimeout(() => {
    transactions.update(store =>
      store.map(t => {
        if (t.id === transaction.id) {
          const newState = { ...t, ...transaction, eventCode }

          const listener =
            t.emitter.listeners[eventCode] &&
            typeof t.emitter.listeners[eventCode] === 'function'

          const defaultNotification = createDefaultNotification(newState)

          let notification

          const result = listener
            ? t.emitter.listeners[eventCode](
                withoutProps(['emitter', 'notification'], newState)
              )
            : undefined

          if (result === false) {
            notification = null
          } else if (typeof result === 'object') {
            notification = { ...defaultNotification, ...result }
          } else {
            notification = defaultNotification
          }

          // update state
          return { ...newState, notification }
        }

        return t
      })
    )
  }, 300)
}
