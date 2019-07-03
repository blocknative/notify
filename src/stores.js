import { writable, derived } from 'svelte/store'
import {
  createDefaultNotification,
  withoutProps,
  createTimestamp
} from './utilities'

export const app = writable({
  version: null,
  dappId: null,
  networkId: null,
  watchedAccounts: null
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
  transactions.update(store => store.filter(t => t.id || t.hash !== id))

export const updateTransaction = (transaction, eventCode) => {
  setTimeout(() => {
    transactions.update(store => {
      const existingTransaction = store.find(
        t => t.id === transaction.id || transaction.hash
      )

      if (!existingTransaction) {
        const newState = {
          ...transaction,
          eventCode,
          timestamp: createTimestamp()
        }
        return [
          ...store,
          {
            ...newState,
            notification: createDefaultNotification(newState)
          }
        ]
      }

      return store.map(t => {
        if (t.id === transaction.id || transaction.hash) {
          const newState = { ...t, ...transaction, eventCode }

          const listener =
            t.emitter &&
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
    })
  }, 300)
}
