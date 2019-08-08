import uuid from "uuid/v4"
import Blocknative from "@flexdapps/blocknative-api"
import Notify from "./Notify.svelte"
import { updateTransaction } from "./stores"
import { getItem } from "./utilities"

import {
  app,
  accounts,
  contracts,
  transactions,
  customNotifications,
  styles
} from "./stores"

import { createEmitter } from "./utilities"

const version = "0.0.1"

function init(config) {
  // validate config
  const { dappId, networkId } = config

  const blocknative = Blocknative({
    dappId,
    networkId,
    connectionId: getItem("connectionId") || undefined,
    transactionCallback: updateTransaction
  })

  // save config to app store
  app.update(store => ({ ...store, ...config, version }))

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
      eventCode: "watchContractAddress",
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
      categoryCode: "watch",
      eventCode: "accountAddress",
      account: {
        id,
        address
      }
    })

    return emitter
  }

  function transaction(hash) {
    // create timestamp
    const timestamp = Date.now()
    const transaction = blocknative.transaction(hash)
    const { emitter, details } = transaction
    console.log({ emitter })

    emitter.on("txPool", transaction => console.log("EMITTER", transaction))
    // add transaction to transactions store
    transactions.update(store => [
      ...store,
      { ...details, emitter, notification: null, timestamp }
    ])
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
      eventCode: "customNotification",
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
