import { writable } from "svelte/store"
import { updateOrAdd } from "./utilities"

export const app = writable({
  version: null,
  dappId: null,
  networkId: null,
  nodeSynced: true
})
export const accounts = writable([])
export const contracts = writable([])
export const transactions = createTransactionStore([])
export const notifications = createNotificationStore([])

export const styles = writable({
  mobilePosition: null,
  desktopPosition: null,
  darkMode: null,
  headlessMode: null,
  css: null
})

function createTransactionStore(initialState) {
  const { subscribe, update } = writable(initialState)

  function updateQueue(transaction) {
    const predicate = tx => tx.id === transaction.id

    update(store => {
      return updateOrAdd(store, predicate, transaction)
    })
  }

  function add(transaction) {
    update(store => [...store, transaction])
  }

  return {
    subscribe,
    updateQueue,
    add
  }
}

function createNotificationStore(initialState) {
  const { subscribe, update } = writable(initialState)

  function add(notification) {
    update(store => {
      const existingNotification = store.find(n => n.id === notification.id)
      if (notification.type === "hint" || !existingNotification) {
        return [...store, notification]
      }

      return [
        ...store.filter(n => n.id !== notification.id || n.type === "hint"),
        notification
      ]
    })
  }

  function remove({ id, eventCode }) {
    update(store => store.filter(n => n.id !== id || n.eventCode !== eventCode))
  }

  return {
    subscribe,
    add,
    remove,
    update
  }
}
