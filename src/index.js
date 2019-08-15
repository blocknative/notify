import blocknativeApi from "./bn-api-client"
import Notify from "./Notify.svelte"
import { handleTransaction } from "./stores"

import { app } from "./stores"

const version = "0.0.1"

function init(config) {
  // validate config
  const { dappId, networkId } = config

  const blocknative = blocknativeApi({
    dappId,
    networkId,
    transactionCallback: handleTransaction
  })

  // save config to app store
  app.update(store => ({ ...store, ...config, version }))

  // initialize App
  new Notify({
    target: document.body
  })

  return {
    account,
    transaction
  }

  function account(address) {
    const { emitter } = blocknative.account(address)
    return emitter
  }

  function transaction(hash) {
    const transaction = blocknative.transaction(hash)
    const { emitter } = transaction

    return emitter
  }

  // function contract(address) {
  //   // create id for contract
  //   const id = uuid()

  //   // create timestamp
  //   const timestamp = Date.now()

  //   // create emitter for contract
  //   const emitter = createEmitter(id)

  //   // add contract address to contracts store
  //   contracts.update(store => [...store, { id, address, timestamp, emitter }])

  //   // logEvent to server
  //   logEvent({
  //     eventCode: "watchContractAddress",
  //     id,
  //     address
  //   })

  //   return emitter
  // }

  // function custom(notification) {
  //   // create id for transaction
  //   const id = uuid()

  //   // create timestamp for transaction
  //   const timestamp = Date.now()

  //   // add transaction to transactions store
  //   customNotifications.update(store => [
  //     ...store,
  //     { id, timestamp, ...notification }
  //   ])

  //   // logEvent to server
  //   logEvent({
  //     eventCode: "customNotification",
  //     id,
  //     notification
  //   })

  //   const dismiss = customNotifications.update(store =>
  //     store.filter(n => n.id !== id)
  //   )

  //   const update = notification =>
  //     customNotifications.update(store =>
  //       store.map(n => {
  //         if (n.id === id) {
  //           return {
  //             ...n,
  //             ...notification
  //           }
  //         }
  //         return n
  //       })
  //     )

  //   return {
  //     dismiss,
  //     update
  //   }
  // }

  // function style(config) {
  //   styles.update(store => ({ ...store, ...config }))
  // }
}

export default { init }
