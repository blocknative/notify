import 'regenerator-runtime/runtime'

import uuid from 'uuid/v4'
import { locale, dictionary, getClientLocale } from 'svelte-i18n'

import Notify from './views/Notify.svelte'

import { app, notifications } from './stores'
import { handleTransactionEvent, preflightTransaction } from './transactions'
import { createNotification } from './notifications'

import { getBlocknative } from './services'
import { LocaleMessages } from './interfaces'

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
} from './interfaces'

import {
  validateInit,
  validateTransactionOptions,
  validateNotificationObject,
  validateConfig
} from './validation'

import { createEmitter } from './utilities'

import { version } from '../package.json'

let notify: any

function init(options: InitOptions): API {
  if (notify) {
    console.warn('notify has already been initialized')
    notify.$destroy()
  }

  validateInit(options)

  const { dappId, networkId, transactionHandler } = options

  const transactionHandlers: TransactionHandler[] = [handleTransactionEvent]

  if (transactionHandler) {
    transactionHandlers.push(transactionHandler)
  }

  const blocknative = getBlocknative({
    dappId,
    networkId,
    transactionHandlers,
    name: 'Notify'
  })

  // save config to app store
  app.update((store: AppStore) => ({
    ...store,
    ...options,
    version,
    clientLocale: getClientLocale({
      fallback: 'en',
      navigator: true
    })
  }))

  // initialize App
  notify = new Notify({
    target: document.body
  })

  app.subscribe((store: AppStore) => {
    const { notifyMessages, clientLocale } = store

    // set the dictionary for i18n
    dictionary.set(notifyMessages)

    const availableLocale: LocaleMessages | undefined =
      notifyMessages[clientLocale] || notifyMessages[clientLocale.slice(0, 2)]
    locale.set(availableLocale ? clientLocale : 'en')
  })

  return {
    hash,
    transaction,
    account,
    unsubscribe,
    notification,
    config
  }

  function account(
    address: string
  ): { details: { address: string }; emitter: Emitter } | never {
    try {
      const result = blocknative.account(address)
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
      const result = blocknative.transaction(hash, id)
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

  function unsubscribe(addressOrHash: string) {
    blocknative.unsubscribe(addressOrHash)
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

    const dismiss = () => notifications.remove(id, eventCode)

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

    const { notifyMessages, ...otherOptions } = options

    app.update((store: AppStore) => {
      return {
        ...store,
        ...otherOptions,
        notifyMessages: notifyMessages
          ? { ...store.notifyMessages, ...notifyMessages }
          : store.notifyMessages
      }
    })
  }
}

export default init
