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

export const configuration = writable({
  mobilePosition: "top",
  desktopPosition: "bottomRight",
  darkMode: null,
  txApproveReminderTimeout: null,
  txStallPendingTimeout: null,
  txStallConfirmedTimeout: null
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

      // if notification is a hint type or there are no existing notifications with same id, then just add it.
      if (notification.type === "hint" || !existingNotification) {
        return [...store, notification]
      }

      // otherwise filter out all notifications with the same id and then add the new notification
      return [...store.filter(n => n.id !== notification.id), notification]
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
