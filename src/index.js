import bigInt from "big-integer"
import uuid from "uuid/v4"
import blocknativeSdk from "./bn-client-sdk"
import { locale, dictionary, getClientLocale, _ } from "svelte-i18n"

import { get } from "svelte/store"
import { notifyMessages } from "./i18n"

import Notify from "./views/Notify.svelte"

import { app, transactions, notifications, configuration } from "./stores"

import {
  handlePreFlightEvent,
  handleTransactionEvent,
  duplicateTransactionCandidate
} from "./transactions"

import { createNotification } from "./notifications"

import {
  validateInit,
  validateTransactionOptions,
  validateNotificationObject,
  validateConfig
} from "./validation"

import { extractMessageFromError } from "./utilities"

import { txTimeouts } from "./defaults"

const version = "0.0.1"

let transactionQueue
transactions.subscribe(store => (transactionQueue = store))

function init(initialize) {
  validateInit(initialize)

  const { dappId, networkId } = initialize

  const blocknative = blocknativeSdk({
    dappId,
    networkId,
    transactionCallback: handleTransactionEvent
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
  locale.set(
    getClientLocale({
      fallback: "en-US",
      navigator: true
    })
  )

  return {
    account,
    hash,
    transaction,
    notification,
    config
  }

  function account(address) {
    try {
      const { emitter } = blocknative.account(address)
      return emitter
    } catch (error) {
      throw new Error(error)
    }
  }

  function hash(hash, id) {
    try {
      const { emitter } = blocknative.transaction(hash, id)
      return emitter
    } catch (error) {
      throw new Error(error)
    }
  }

  function transaction(options) {
    return new Promise(async (resolve, reject) => {
      validateTransactionOptions(options)

      const {
        sendTransaction,
        estimateGas,
        gasPrice,
        balance,
        contract,
        txDetails,
        listeners
      } = options

      //=== if `balance` is not provided, then sufficient funds check is disabled === //
      //=== if `txDetails` is not provided, then duplicate transaction check is disabled === //
      //== if dev doesn't want notifiy to intiate the transaction and `sendTransaction` is not provided, then transaction rejected notification is disabled ==//
      //=== to disable hints for `txAwaitingApproval`, `txConfirmReminder` or any other notification, then return false from listener functions ==//

      const gasLimit =
        estimateGas &&
        bigInt(
          await estimateGas().catch(err =>
            console.error("There was a problem estimating gas:", err)
          )
        )
      const price =
        gasPrice &&
        bigInt(
          await gasPrice().catch(err =>
            console.error("There was a problem getting current gas price:", err)
          )
        )

      const id = uuid()

      const txObject = {
        ...txDetails,
        value: String(txDetails.value),
        gas: gasLimit && gasLimit.toString(),
        gasPrice: price && price.toString(),
        id
      }

      // check sufficient balance if required parameters are available
      if (balance && gasLimit && gasPrice) {
        const transactionCost = gasLimit
          .times(price)
          .plus(bigInt(txDetails.value))

        // if transaction cost is greater than the current balance
        if (transactionCost.compare(bigInt(balance)) === 1) {
          const eventCode = "nsfFail"

          handlePreFlightEvent({
            blocknative,
            eventCode,
            contract,
            balance,
            txObject,
            listeners
          })

          return reject("User has insufficient funds")
        }
      }

      // check if it is a duplicate transaction
      if (
        txDetails &&
        duplicateTransactionCandidate(
          { to: txDetails.to, value: txDetails.value },
          contract
        )
      ) {
        const eventCode = "txRepeat"

        handlePreFlightEvent({
          blocknative,
          eventCode,
          contract,
          balance,
          txObject,
          listeners
        })
      }

      // get any timeout configurations
      const {
        txApproveReminderTimeout,
        txStallPendingTimeout,
        txStallConfirmedTimeout
      } = get(configuration)

      // check previous transactions awaiting approval
      if (transactionQueue.find(tx => tx.status === "awaitingApproval")) {
        const eventCode = "txAwaitingApproval"

        handlePreFlightEvent({
          blocknative,
          eventCode,
          contract,
          balance,
          txObject,
          listeners
        })
      }

      // confirm reminder after timeout
      setTimeout(() => {
        const awaitingApproval = transactionQueue.find(
          tx => tx.id === id && tx.status === "awaitingApproval"
        )

        if (awaitingApproval) {
          const eventCode = "txConfirmReminder"

          handlePreFlightEvent({
            blocknative,
            eventCode,
            contract,
            balance,
            txObject,
            listeners
          })
        }
      }, txApproveReminderTimeout || txTimeouts.txApproveReminderTimeout)

      handlePreFlightEvent({
        blocknative,
        eventCode: "txRequest",
        status: "awaitingApproval",
        contract,
        balance,
        txObject,
        listeners
      })

      // if not provided with sendTransaction function, resolve with id so dev can initiate transaction
      // dev will need to call notify.hash(txHash, id) with this id to link up the preflight with the postflight notifications
      if (!sendTransaction) {
        return resolve({ id })
      }

      // initiate transaction
      const sendTransactionResult = sendTransaction()

      // get result and handle errors
      const result = await sendTransactionResult.catch(error => {
        const { eventCode, errorMsg } = extractMessageFromError(error.message)

        handlePreFlightEvent({
          blocknative,
          eventCode,
          status: "failed",
          contract,
          balance,
          txObject,
          listeners
        })

        return reject(errorMsg)
      })

      if (result && result.hash) {
        const emitter = hash(result.hash, id)

        // Check for pending stall status
        setTimeout(() => {
          const transaction = transactionQueue.find(tx => tx.id === id)
          if (
            transaction &&
            transaction.status === "sent" &&
            blocknative.status.connected &&
            blocknative.status.nodeSynced
          ) {
            const eventCode = "txStallPending"

            handlePreFlightEvent({
              blocknative,
              eventCode,
              contract,
              balance,
              txObject,
              listeners
            })
          }
        }, txStallPendingTimeout || txTimeouts.txStallPendingTimeout)

        // Check for confirmed stall status
        setTimeout(() => {
          const transaction = transactionQueue.find(tx => tx.id === id)

          if (
            transaction &&
            transaction.status === "pending" &&
            blocknative.status.connected &&
            blocknative.status.nodeSynced
          ) {
            const eventCode = "txStallConfirmed"

            handlePreFlightEvent({
              blocknative,
              eventCode,
              contract,
              balance,
              txObject,
              listeners
            })
          }
        }, txStallConfirmedTimeout || txTimeouts.txStallConfirmedTimeout)

        resolve({ emitter, sendTransactionResult })
      }
    })
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
    configuration.update(store => ({ ...store, ...options }))
  }
}

export default { init }
