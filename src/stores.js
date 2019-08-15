import { writable, derived } from "svelte/store"
import { createDefaultNotification, createTimestamp } from "./utilities"

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

let currentTransactions
transactions.subscribe(store => {
  currentTransactions = store
})

export function handleTransaction({ transaction, emitterResult }) {
  const knownTransaction = currentTransactions.find(
    tx => tx.hash === transaction.originalHash || tx.hash === transaction.hash
  )

  if (knownTransaction) {
    // update transaction in queue to new hash if speedUp or cancel
    if (
      transaction.eventCode === "txSpeedUp" ||
      transaction.eventCode === "txCancel"
    ) {
      transactions.update(store => {
        return store.map(tx => {
          if (tx.hash === transaction.originalHash) {
            tx.hash = transaction.hash
          }
          return tx
        })
      })
    }

    updateTransaction({ transaction, emitterResult })
  } else {
    createTransaction({ transaction, emitterResult })
  }
}

export function removeTransactionNotification(hash) {
  transactions.update(store =>
    store.map(transaction => {
      if (transaction.hash === hash) {
        transaction.notification = null
      }

      return transaction
    })
  )
}

export function createTransaction({ transaction, emitterResult }) {
  const newState = {
    ...transaction,
    timestamp: createTimestamp()
  }

  const defaultNotification = createDefaultNotification(newState)

  let notification

  if (emitterResult === "false") {
    notification = null
  } else if (typeof emitterResult === "object") {
    notification = { ...defaultNotification, ...emitterResult }
  } else {
    notification = defaultNotification
  }

  // update transactions store
  transactions.update(store => {
    return [
      ...store,
      {
        ...newState,
        notification
      }
    ]
  })
}

export const updateTransaction = ({ transaction, emitterResult }) => {
  removeTransactionNotification(transaction.originalHash || transaction.hash)

  setTimeout(() => {
    transactions.update(store => {
      return store.map(t => {
        if (
          t.hash === transaction.originalHash ||
          t.hash === transaction.hash
        ) {
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
