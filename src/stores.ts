import { writable } from "svelte/store"
import { replaceOrAdd } from "./utilities"
import { defaultNotifyMessages } from "./i18n"

import {
  WritableStore,
  TransactionData,
  TransactionStore,
  NotificationObject,
  NotificationStore
} from "./interfaces"

export const app: WritableStore = writable({
  version: "",
  dappId: "",
  networkId: 1,
  nodeSynced: true,
  mobilePosition: "top",
  desktopPosition: "bottomRight",
  darkMode: false,
  txApproveReminderTimeout: 20000,
  txStallPendingTimeout: 20000,
  txStallConfirmedTimeout: 90000,
  clientLocale: "en",
  notifyMessages: defaultNotifyMessages
})
export const accounts: WritableStore = writable([])
export const contracts: WritableStore = writable([])
export const transactions: TransactionStore = createTransactionStore([])
export const notifications: NotificationStore = createNotificationStore([])

function createTransactionStore(initialState: TransactionData[]) {
  const { subscribe, update } = writable(initialState)

  function updateQueue(transaction: TransactionData) {
    const predicate = (tx: TransactionData) => tx.id === transaction.id

    update((store: TransactionData[]) => {
      return replaceOrAdd(store, predicate, transaction)
    })
  }

  function add(transaction: TransactionData) {
    update((store: TransactionData[]) => [...store, transaction])
  }

  return {
    subscribe,
    updateQueue,
    add
  }
}

function createNotificationStore(initialState: NotificationObject[]) {
  const { subscribe, update } = writable(initialState)

  function add(notification: NotificationObject) {
    update((store: NotificationObject[]) => {
      const existingNotification = store.find(
        (n: NotificationObject) => n.id === notification.id
      )

      // if notification is a hint type or there are no existing notifications with same id, then just add it.
      if (notification.type === "hint" || !existingNotification) {
        return [...store, notification]
      }

      // otherwise filter out all notifications with the same id and then add the new notification
      return [
        ...store.filter((n: NotificationObject) => n.id !== notification.id),
        notification
      ]
    })
  }

  function remove(id: string, eventCode: string) {
    update((store: NotificationObject[]) =>
      store.filter(
        (n: NotificationObject) => n.id !== id || n.eventCode !== eventCode
      )
    )
  }

  return {
    subscribe,
    add,
    remove,
    update
  }
}
