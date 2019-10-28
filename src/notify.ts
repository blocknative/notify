import "regenerator-runtime/runtime"

import uuid from "uuid/v4"
import { locale, dictionary, getClientLocale, _ } from "svelte-i18n"
import { notifyMessages } from "./i18n"

import Notify from "./views/Notify.svelte"

import { app, notifications } from "./stores"
import { handleTransactionEvent, preflightTransaction } from "./transactions"
import { createNotification } from "./notifications"

import { getBlocknative } from "./services"

import {
  InitOptions,
  TransactionHandler,
  AppStore,
  API,
  TransactionLog,
  Emitter,
  TransactionOptions,
  CustomNotificationObject,
  UpdateNotification,
  ConfigOptions
} from "./interfaces"

import {
  validateInit,
  validateTransactionOptions,
  validateNotificationObject,
  validateConfig
} from "./validation"

import { createEmitter } from "./utilities"

const version: string = "0.0.1"

function init(options: InitOptions): API {
  validateInit(options)

  const { dappId, networkId, transactionHandler } = options

  const transactionHandlers: TransactionHandler[] = [handleTransactionEvent]

  if (transactionHandler) {
    transactionHandlers.push(transactionHandler)
  }

  const blocknative = getBlocknative({ dappId, networkId, transactionHandlers })

  // save config to app store
  app.update((store: AppStore) => ({ ...store, ...options, version }))

  // initialize App
  new Notify({
    target: document.body
  })

  // set the dictionary for i18n
  dictionary.set(notifyMessages)

  // set the locale for i18n
  const clientLocale: string = getClientLocale({
    fallback: "en",
    navigator: true
  })

  const availableLocale: string | undefined =
    notifyMessages[clientLocale] || notifyMessages[clientLocale.slice(0, 2)]

  locale.set(availableLocale ? clientLocale : "en")

  return {
    hash,
    transaction,
    account,
    notification,
    config
  }

  function account(
    address: string
  ): { details: { address: string }; emitter: Emitter } | never {
    try {
      const result = blocknative.account(blocknative.clientIndex, address)
      return result
    } catch (error) {
      throw new Error(error)
    }
  }

  function hash(
    hash: string,
    id?: string
  ): never | { details: TransactionLog; emitter: Emitter } {
    try {
      const result = blocknative.transaction(blocknative.clientIndex, hash, id)
      return result
    } catch (error) {
      throw new Error(error)
    }
  }

  function transaction(
    options: TransactionOptions
  ): { result: Promise<string>; emitter: Emitter } {
    validateTransactionOptions(options)

    const emitter = createEmitter()

    const result = preflightTransaction(options, emitter)

    return {
      emitter,
      result
    }
  }

  function notification(
    notificationObject: CustomNotificationObject
  ): {
    dismiss: () => void
    update: UpdateNotification
  } {
    validateNotificationObject(notificationObject)

    let key = 0

    const id: string = uuid()
    const startTime: number = Date.now()
    const { eventCode = `customNotification${key++}` } = notificationObject

    const dismiss = () => notifications.remove(id)

    function update(
      notificationUpdate: CustomNotificationObject
    ): {
      dismiss: () => void
      update: UpdateNotification
    } {
      validateNotificationObject(notificationUpdate)

      const { eventCode = `customNotification${key++}` } = notificationUpdate
      createNotification({ id, startTime, eventCode }, notificationUpdate)

      return {
        dismiss,
        update
      }
    }

    createNotification({ id, startTime, eventCode }, notificationObject)

    return {
      dismiss,
      update
    }
  }

  function config(options: ConfigOptions): void {
    validateConfig(options)
    app.update((store: AppStore) => ({ ...store, ...options }))
  }
}

export default init
