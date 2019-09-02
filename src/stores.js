import { writable } from "svelte/store"
import { waitForUi, updateOrAdd } from "./utilities"

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

  return {
    subscribe,
    updateQueue
  }
}

function createNotificationStore(initialState) {
  const { subscribe, update } = writable(initialState)

  let notificationQueue = {}
  let waiting = {}

  let currentNotifications
  subscribe(store => {
    currentNotifications = store
  })

  function add(notification) {
    if (waiting[notification.id]) {
      const currentQueue = notificationQueue[notification.id] || []

      notificationQueue[notification.id] = [...currentQueue, notification]
      return
    }

    const existingNotification = currentNotifications.find(
      n => n.id === notification.id
    )

    if (notification.type === "hint" || !existingNotification) {
      update(store => [...store, notification])
      return
    }

    waiting[notification.id] = true

    removeAll(notification.id)

    setTimeout(() => {
      update(() => [...currentNotifications, notification])
      setTimeout(() => {
        waiting[notification.id] = false
        notificationQueue[notification.id] &&
          notificationQueue[notification.id][0] &&
          add(notificationQueue[notification.id].shift())
        setTimeout(() => {
          if (
            !waiting[notification.id] &&
            (!notificationQueue[notification.id] ||
              !notificationQueue[notification.id].length)
          ) {
            delete waiting[notification.id]
            delete notificationQueue[notification.id]
          }
        }, 2500)
      }, 2000)
    }, 601)
  }

  function removeAll(id) {
    update(store => store.filter(n => n.id !== id))
  }

  function remove({ id, eventCode }) {
    update(store => store.filter(n => n.id !== id || n.eventCode !== eventCode))
  }

  return {
    subscribe,
    add,
    remove
  }
}
