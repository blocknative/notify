import "regenerator-runtime/runtime"

import uuid from "uuid/v4"
import blocknativeSdk from "bn-sdk"
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
    notification,
    config
  }

  // function account(address) {
  //   try {
  //     const { emitter } = blocknative.account(address)
  //     return emitter
  //   } catch (error) {
  //     throw new Error(error)
  //   }
  // }

  function hash(hash, id) {
    try {
      const { emitter } = blocknative.transaction(hash, id)
      return emitter
    } catch (error) {
      throw new Error(error)
    }
  }

  function transaction(options) {
    validateTransactionOptions(options)

    const emitter = createEmitter()

    const id = preflightTransaction(options, emitter, blocknative)

    return {
      emitter,
      id
    }
  }

  function notification(eventCode, notificationObject) {
    validateNotificationObject(notificationObject)

    const id = uuid()
    const startTime = Date.now()

    const dismiss = () => notifications.remove({ id, eventCode })

    function update(eventCode, notificationUpdate) {
      validateNotificationObject(notificationUpdate)
      createNotification({ id, startTime, eventCode }, notificationUpdate)

      return {
        dismiss,
        update
      }
    }

    // create notification
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
