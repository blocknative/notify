import "regenerator-runtime/runtime"

import uuid from "uuid/v4"
import blocknativeSdk from "bnc-sdk"
import { locale, dictionary, getClientLocale, _ } from "svelte-i18n"
import { notifyMessages } from "./i18n"

import Notify from "./views/Notify.svelte"

import { app, notifications } from "./stores"

import { handleTransactionEvent, preflightTransaction } from "./transactions"

import { createNotification } from "./notifications"

import {
  validateInit,
  validateTransactionOptions,
  validateNotificationObject,
  validateConfig
} from "./validation"

import { createEmitter } from "./utilities"

const version = "0.0.1"

function init(initialize) {
  validateInit(initialize)

  const { dappId, networkId, transactionEvents } = initialize

  const transactionListeners = [handleTransactionEvent]

  if (transactionEvents) {
    transactionListeners.push(transactionEvents)
  }

  const blocknative = new blocknativeSdk({
    dappId,
    networkId,
    transactionListeners
  })

  // save config to app store
  app.update(store => ({ ...store, ...initialize, version }))

  // initialize App
  new Notify({
    target: document.body
  })

  // set the dictionary for i18n
  dictionary.set(notifyMessages)

  // set the locale for i18n
  const clientLocale = getClientLocale({
    fallback: "en",
    navigator: true
  })

  const availableLocale =
    notifyMessages[clientLocale] || notifyMessages[clientLocale.slice(0, 2)]

  locale.set(availableLocale ? clientLocale : "en")

  return {
    hash,
    transaction,
    account,
    notification,
    config
  }

  function account(address) {
    try {
      const result = blocknative.account(address)
      return result
    } catch (error) {
      throw new Error(error)
    }
  }

  function hash(hash, id) {
    try {
      const result = blocknative.transaction(hash, id)
      return result
    } catch (error) {
      throw new Error(error)
    }
  }

  function transaction(options) {
    validateTransactionOptions(options)

    const emitter = createEmitter()

    const result = preflightTransaction(options, emitter, blocknative)

    return {
      emitter,
      result
    }
  }

  function notification(notificationObject) {
    validateNotificationObject(notificationObject)

    let key = 0

    const id = uuid()
    const startTime = Date.now()
    const { eventCode = `customNotification${key++}` } = notificationObject

    const dismiss = () => notifications.remove(id)

    function update(notificationUpdate) {
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

  function config(options) {
    validateConfig(options)
    app.update(store => ({ ...store, ...options }))
  }
}

export default init
