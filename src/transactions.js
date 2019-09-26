import BigNumber from "bignumber.js"
import uuid from "uuid/v4"
import { get } from "svelte/store"

import { transactions, app } from "./stores"
import { createNotification } from "./notifications"
import { argsEqual, extractMessageFromError } from "./utilities"
import { validateNotificationObject } from "./validation"

let transactionQueue
transactions.subscribe(store => (transactionQueue = store))

export function handlePreFlightEvent({
  eventCode,
  contract,
  balance,
  txObject,
  emitter,
  blocknative,
  status
}) {
  blocknative.event({
    categoryCode: contract ? "activeContract" : "activeTransaction",
    eventCode,
    transaction: txObject,
    wallet: { balance },
    contract
  })

  const transaction = {
    ...txObject,
    eventCode,
    status,
    contract
  }

  const listener = emitter.listeners[eventCode] || emitter.listeners.all

  const emitterResult = listener && listener(transaction)

  if (emitterResult) {
    validateNotificationObject(emitterResult)
  }

  handleTransactionEvent({
    transaction: transaction,
    emitterResult
  })
}

export function handleTransactionEvent({ transaction, emitterResult }) {
  // transaction queue alread has tx with same id and same eventCode then don't update
  // this is to allow for the fact that the server mirrors events sent to it
  if (
    transactionQueue.find(
      tx => tx.id === transaction.id && tx.eventCode === transaction.eventCode
    )
  ) {
    return
  }

  transactions.updateQueue(transaction)

  // create notification if dev hasn't opted out
  if (emitterResult !== false) {
    const transactionObj = transactionQueue.find(tx => tx.id === transaction.id)
    createNotification(transactionObj, emitterResult)
  }
}

export function duplicateTransactionCandidate(transaction, contract) {
  let duplicate = transactionQueue.find(tx => {
    if (contract && typeof tx.contract === "undefined") return false

    const sameMethod = contract
      ? contract.methodName === tx.contract.methodName
      : true

    const sameParams = contract
      ? argsEqual(contract.parameters, tx.contract.parameters)
      : true

    const sameVal = tx.value == transaction.value

    const sameTo = contract
      ? sameMethod
      : tx.to.toLowerCase() === transaction.to.toLowerCase()

    return sameMethod && sameParams && sameVal && sameTo
  })

  if (
    duplicate &&
    (duplicate.status === "confirmed" || duplicate.status === "failed")
  ) {
    duplicate = false
  }

  return duplicate
}

export function preflightTransaction(options, emitter, blocknative) {
  return new Promise((resolve, reject) => {
    // wrap in set timeout to put to the end of the event queue
    setTimeout(async () => {
      const {
        sendTransaction,
        estimateGas,
        gasPrice,
        balance,
        contract,
        txDetails = {}
      } = options

      //=== if `balance` or `estimateGas` or `gasPrice` is not provided, then sufficient funds check is disabled === //
      //=== if `txDetails` is not provided, then duplicate transaction check is disabled === //
      //== if dev doesn't want notify to intiate the transaction and `sendTransaction` is not provided, then transaction rejected notification is disabled ==//
      //=== to disable hints for `txAwaitingApproval`, `txConfirmReminder` or any other notification, then return false from listener functions ==//

      const [gas, price] = await gasEstimates(estimateGas, gasPrice)
      const id = uuid()
      const value = BigNumber(txDetails.value || 0)

      const txObject = {
        ...txDetails,
        value: value.toString(),
        gas: gas && gas.toString(),
        gasPrice: price && price.toString(),
        id
      }

      // check sufficient balance if required parameters are available
      if (balance && gas && price) {
        const transactionCost = gas.times(price).plus(value)

        // if transaction cost is greater than the current balance
        if (transactionCost.gt(BigNumber(balance))) {
          const eventCode = "nsfFail"

          handlePreFlightEvent({
            blocknative,
            eventCode,
            contract,
            balance,
            txObject,
            emitter
          })

          return reject("User has insufficient funds")
        }
      }

      // check if it is a duplicate transaction
      if (
        txDetails &&
        duplicateTransactionCandidate(
          { to: txObject.to, value: txObject.value },
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
          emitter
        })
      }

      const {
        txApproveReminderTimeout,
        txStallPendingTimeout,
        txStallConfirmedTimeout
      } = get(app)

      // check previous transactions awaiting approval
      if (transactionQueue.find(tx => tx.status === "awaitingApproval")) {
        const eventCode = "txAwaitingApproval"

        handlePreFlightEvent({
          blocknative,
          eventCode,
          contract,
          balance,
          txObject,
          emitter
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
            emitter
          })
        }
      }, txApproveReminderTimeout)

      handlePreFlightEvent({
        blocknative,
        eventCode: "txRequest",
        status: "awaitingApproval",
        contract,
        balance,
        txObject,
        emitter
      })

      resolve(id)

      // if not provided with sendTransaction function, resolve with id so dev can initiate transaction
      // dev will need to call notify.hash(txHash, id) with this id to link up the preflight with the postflight notifications
      if (!sendTransaction) {
        return
      }

      // initiate transaction
      const sendTransactionResult = sendTransaction()

      // get result and handle errors
      const result = await sendTransactionResult.catch(error => {
        const { eventCode, errorMsg } = extractMessageFromError(error)

        handlePreFlightEvent({
          blocknative,
          eventCode,
          status: "failed",
          contract,
          balance,
          txObject,
          emitter
        })

        return reject(errorMsg)
      })

      if (result && result.hash) {
        const serverEmitter = blocknative.transaction(result.hash, id).emitter

        serverEmitter.on("all", transaction => {
          const listener =
            emitter.listeners[transaction.eventCode] || emitter.listeners.all
          const result = listener && listener(transaction)
          return result
        })

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
              emitter
            })
          }
        }, txStallPendingTimeout)

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
              emitter
            })
          }
        }, txStallConfirmedTimeout)
      }
    }, 10)
  })
}

function gasEstimates(gasFunc, gasPriceFunc) {
  if (!gasFunc || !gasPriceFunc) {
    return Promise.resolve([])
  }

  const gasProm = gasFunc()
  if (!gasProm.then) {
    throw new Error("The `estimateGas` function must return a Promise")
  }

  const gasPriceProm = gasPriceFunc()
  if (!gasPriceProm.then) {
    throw new Error("The `gasPrice` function must return a Promise")
  }

  return Promise.all([gasProm, gasPriceProm])
    .then(([gasResult, gasPriceResult]) => {
      if (typeof gasResult !== "string") {
        throw new Error(
          `The Promise returned from calling 'estimateGas' must resolve with a value of type 'string'. Received a value of: ${gasResult} with a type: ${typeof gasResult}`
        )
      }

      if (typeof gasPriceResult !== "string") {
        throw new Error(
          `The Promise returned from calling 'gasPrice' must resolve with a value of type 'string'. Received a value of: ${gasPriceResult} with a type: ${typeof gasPriceResult}`
        )
      }

      return [BigNumber(gasResult), BigNumber(gasPriceResult)]
    })
    .catch(error => {
      throw new Error(`There was an error getting gas estimates: ${error}`)
    })
}
