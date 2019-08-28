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

  let currentNotifications
  subscribe(store => (currentNotifications = store))

  function add(notification) {
    const existingNotification = currentNotifications.find(
      n => n.id === notification.id
    )

    // if hint type then don't want to remove existing notification
    if (
      existingNotification &&
      existingNotification.type !== "hint" &&
      notification.type !== "hint"
    ) {
      remove(existingNotification.id, existingNotification.type)
      setTimeout(() => {
        update(store => [...store, notification])
      }, 410)
    } else {
      update(store => [...store, notification])
    }
  }

  function remove(id, type) {
    update(store =>
      store.filter(n => {
        if (n.id === id) {
          if (type !== "hint" || n.type === "hint") {
            return false
          }
        }

        return true
      })
    )
  }

  return {
    subscribe,
    add,
    remove
  }
}
