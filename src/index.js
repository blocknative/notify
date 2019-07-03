import uuid from 'uuid/v4'

import Notify from './Notify.svelte'

import {
  app,
  accounts,
  contracts,
  transactions,
  customNotifications,
  styles
} from './stores'

import { createEmitter } from './utilities'
import { openWebSocketConnection, logEvent } from './websockets'

const version = '0.0.1'

function init(config) {
  // validate config

  // save config to app store
  app.update(store => ({ ...store, ...config, version }))

  // open websocket connection
  openWebSocketConnection()

  // initialize App
  new Notify({
    target: document.body
  })

  function contract(address) {
    // create id for contract
    const id = uuid()

    // create timestamp
    const timestamp = Date.now()

    // create emitter for contract
    const emitter = createEmitter(id)

    // add contract address to contracts store
    contracts.update(store => [...store, { id, address, timestamp, emitter }])

    // logEvent to server
    logEvent({
      eventCode: 'watchContractAddress',
      id,
      address
    })

    return emitter
  }

  function account(address) {
    // create id for account
    const id = uuid()

    // create timestamp
    const timestamp = Date.now()

    // create emitter for contract
    const emitter = createEmitter(id)

    // add contract address to contracts store
    accounts.update(store => [...store, { id, address, timestamp, emitter }])

    // logEvent to server
    logEvent({
      categoryCode: 'watch',
      eventCode: 'accountAddress',
      account: {
        id,
        address
      }
    })

    return emitter
  }

  function transaction(hash) {
    // create id for transaction
    const id = uuid()

    // create timestamp for transaction
    const timestamp = Date.now()

    // create emitter for transaction
    const emitter = createEmitter(id)

    // create eventCode for transaction
    const eventCode = 'txSent'

    // add transaction to transactions store
    transactions.update(store => [
      ...store,
      { id, hash, timestamp, eventCode, emitter, notification: null }
    ])

    // logEvent to server
    logEvent({
      eventCode,
      categoryCode: 'activeTransaction',
      transaction: {
        hash,
        id
      }
    })

    return emitter
  }

  function custom(notification) {
    // create id for transaction
    const id = uuid()

    // create timestamp for transaction
    const timestamp = Date.now()

    // add transaction to transactions store
    customNotifications.update(store => [
      ...store,
      { id, timestamp, ...notification }
    ])

    // logEvent to server
    logEvent({
      eventCode: 'customNotification',
      id,
      notification
    })

    const dismiss = customNotifications.update(store =>
      store.filter(n => n.id !== id)
    )

    const update = notification =>
      customNotifications.update(store =>
        store.map(n => {
          if (n.id === id) {
            return {
              ...n,
              ...notification
            }
          }
          return n
        })
      )

    return {
      dismiss,
      update
    }
  }

  function style(config) {
    styles.update(store => ({ ...store, ...config }))
  }

  return {
    contract,
    account,
    transaction,
    custom,
    style
  }
}

export default { init }
