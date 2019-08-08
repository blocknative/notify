import { writable, derived } from "svelte/store"
import {
  createDefaultNotification,
  withoutProps,
  createTimestamp
} from "./utilities"

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

let watchedAccounts
accounts.subscribe(store => {
  watchedAccounts = store
})

export const removeTransactionNotification = hash =>
  transactions.update(store =>
    store.map(transaction => {
      if (transaction.hash === hash) {
        transaction.notification = null
      }

      return transaction
    })
  )

export const createTransaction = (transaction, eventCode) => {
  const newState = {
    ...transaction,
    eventCode,
    timestamp: createTimestamp()
  }

  const activeAccount = watchedAccounts.find(
    acc =>
      acc.address.toLowerCase() === transaction.to.toLowerCase() ||
      acc.address.toLowerCase() === transaction.from.toLowerCase()
  )

  const emitter = activeAccount && activeAccount.emitter

  const listener =
    emitter &&
    emitter.listeners[eventCode] &&
    typeof emitter.listeners[eventCode] === "function"

  const defaultNotification = createDefaultNotification(newState)

  let notification

  const result = listener
    ? emitter.listeners[eventCode](
        withoutProps(["emitter", "notification"], newState)
      )
    : undefined

  if (!result) {
    notification = null
  } else if (typeof result === "object") {
    notification = { ...defaultNotification, ...result }
  } else {
    notification = defaultNotification
  }

  // update transactions store
  transactions.update(store => {
    return [
      ...store,
      {
        ...newState,
        notification,
        emitter
      }
    ]
  })
}

export const updateTransaction = ({ transaction, emitterResult }) => {
  removeTransactionNotification(transaction.hash)

  setTimeout(() => {
    transactions.update(store => {
      return store.map(t => {
        if (t.hash === transaction.hash) {
          transaction = { ...t, ...transaction }
          const defaultNotification = createDefaultNotification(transaction)

          let notification

          if (emitterResult === "false") {
            notification = null
          } else if (typeof emitterResult === "object") {
            notification = { ...defaultNotification, ...emitterResult }
          } else {
            notification = defaultNotification
          }

          // update state
          return { ...transaction, notification }
        }

        return t
      })
    })
  }, 350)
}
