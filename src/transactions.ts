import BigNumber from 'bignumber.js'
import uuid from 'uuid/v4'
import { get } from 'svelte/store'

import { transactions, app } from './stores'
import { createNotification } from './notifications'
import { argsEqual, extractMessageFromError, localNetwork } from './utilities'
import { validateNotificationObject } from './validation'
import { getBlocknative } from './services'
import {
  TransactionData,
  PreflightEvent,
  ContractObject,
  CustomNotificationObject,
  Emitter,
  TransactionOptions
} from './interfaces'

let transactionQueue: TransactionData[]
transactions.subscribe((store: TransactionData[]) => (transactionQueue = store))

export function handlePreFlightEvent(preflightEvent: PreflightEvent) {
  const {
    eventCode,
    contractCall,
    balance,
    txDetails,
    emitter,
    status
  } = preflightEvent

  const blocknative = getBlocknative()

  blocknative.event({
    categoryCode: contractCall ? 'activeContract' : 'activeTransaction',
    eventCode,
    transaction: txDetails,
    wallet: { balance },
    contract: contractCall
  })

  const transaction = {
    ...txDetails,
    eventCode,
    status,
    contractCall
  }

  const emitterResult = emitter.emit(transaction)

  if (emitterResult) {
    validateNotificationObject(emitterResult)
  }

  handleTransactionEvent({
    transaction: transaction,
    emitterResult
  })
}

export function handleTransactionEvent(event: {
  transaction: TransactionData
  emitterResult: boolean | void | CustomNotificationObject
}) {
  const { transaction, emitterResult } = event
  transactions.updateQueue(transaction)

  // create notification if dev hasn't opted out and not connected to a local network
  if (emitterResult !== false && !localNetwork(get(app).networkId)) {
    const transactionObj = transactionQueue.find(
      (tx: TransactionData) => tx.id === transaction.id
    )
    if (transactionObj) {
      createNotification(transactionObj, emitterResult)
    }
  }
}

export function duplicateTransactionCandidate(
  transaction: TransactionData,
  contract: ContractObject
) {
  let duplicate: TransactionData | undefined | boolean = transactionQueue.find(
    (tx: TransactionData) => {
      if (contract && typeof tx.contractCall === 'undefined') return false

      const sameMethod = contract
        ? contract.methodName ===
          (tx.contractCall && tx.contractCall.methodName)
        : true

      const sameParams = contract
        ? argsEqual(contract.params, tx.contractCall && tx.contractCall.params)
        : true

      const sameVal = tx.value == transaction.value

      const sameTo = contract
        ? sameMethod
        : tx.to &&
          tx.to.toLowerCase() === transaction.to &&
          transaction.to.toLowerCase()

      return sameMethod && sameParams && sameVal && sameTo
    }
  )

  if (
    duplicate &&
    (duplicate.status === 'confirmed' || duplicate.status === 'failed')
  ) {
    duplicate = false
  }

  return duplicate
}

export function preflightTransaction(
  options: TransactionOptions,
  emitter: Emitter
): Promise<string> {
  return new Promise((resolve, reject) => {
    // wrap in set timeout to put to the end of the event queue
    setTimeout(async () => {
      const {
        sendTransaction,
        estimateGas,
        gasPrice,
        balance,
        contractCall,
        txDetails
      } = options

      const blocknative = getBlocknative()

      //=== if `balance` or `estimateGas` or `gasPrice` is not provided, then sufficient funds check is disabled === //
      //=== if `txDetails` is not provided, then duplicate transaction check is disabled === //
      //== if dev doesn't want notify to intiate the transaction and `sendTransaction` is not provided, then transaction rejected notification is disabled ==//
      //=== to disable hints for `txAwaitingApproval`, `txConfirmReminder` or any other notification, then return false from listener functions ==//

      const [gas, price] = await gasEstimates(estimateGas, gasPrice)
      const id = uuid()
      const value = new BigNumber((txDetails && txDetails.value) || 0)

      const calculated = {
        value: value.toString(10),
        gas: gas && gas.toString(10),
        gasPrice: price && price.toString(10)
      }

      const txObject = txDetails
        ? {
            ...txDetails,
            ...calculated,
            id
          }
        : { ...calculated, id }

      // check sufficient balance if required parameters are available
      if (balance && gas && price) {
        const transactionCost = gas.times(price).plus(value)

        // if transaction cost is greater than the current balance
        if (transactionCost.gt(new BigNumber(balance))) {
          const eventCode = 'nsfFail'

          handlePreFlightEvent({
            eventCode,
            contractCall,
            balance,
            txDetails: txObject,
            emitter
          })

          return reject('User has insufficient funds')
        }
      }

      // check if it is a duplicate transaction
      if (
        txDetails &&
        duplicateTransactionCandidate(
          { to: txDetails.to, value: txDetails.value },
          contractCall
        )
      ) {
        const eventCode = 'txRepeat'

        handlePreFlightEvent({
          eventCode,
          contractCall,
          balance,
          txDetails: txObject,
          emitter
        })
      }

      const {
        txApproveReminderTimeout,
        txStallPendingTimeout,
        txStallConfirmedTimeout
      } = get(app)

      // check previous transactions awaiting approval
      if (transactionQueue.find(tx => tx.status === 'awaitingApproval')) {
        const eventCode = 'txAwaitingApproval'

        handlePreFlightEvent({
          eventCode,
          contractCall,
          balance,
          txDetails: txObject,
          emitter
        })
      }

      // confirm reminder after timeout
      setTimeout(() => {
        const awaitingApproval = transactionQueue.find(
          tx => tx.id === id && tx.status === 'awaitingApproval'
        )

        if (awaitingApproval) {
          const eventCode = 'txConfirmReminder'

          handlePreFlightEvent({
            eventCode,
            contractCall,
            balance,
            txDetails: txObject,
            emitter
          })
        }
      }, txApproveReminderTimeout)

      handlePreFlightEvent({
        eventCode: 'txRequest',
        status: 'awaitingApproval',
        contractCall,
        balance,
        txDetails: txObject,
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
      let hash
      try {
        hash = await sendTransactionResult
      } catch (error) {
        const { eventCode, errorMsg } = extractMessageFromError(error)

        handlePreFlightEvent({
          eventCode,
          status: 'failed',
          contractCall,
          balance,
          txDetails: txObject,
          emitter
        })

        return reject(errorMsg)
      }

      if (hash && typeof hash === 'string') {
        const serverEmitter = blocknative.transaction(hash, id).emitter

        serverEmitter.on('all', (transaction: TransactionData) => {
          const result = emitter.emit(transaction)
          return result
        })

        // Check for pending stall status
        setTimeout(() => {
          const transaction = transactionQueue.find(
            (tx: TransactionData) => tx.id === id
          )
          if (
            transaction &&
            transaction.status === 'sent' &&
            blocknative.status.connected &&
            blocknative.status.nodeSynced
          ) {
            const eventCode = 'txStallPending'

            handlePreFlightEvent({
              eventCode,
              contractCall,
              balance,
              txDetails: txObject,
              emitter
            })
          }
        }, txStallPendingTimeout)

        // Check for confirmed stall status
        setTimeout(() => {
          const transaction = transactionQueue.find(tx => tx.id === id)

          if (
            transaction &&
            transaction.status === 'pending' &&
            blocknative.status.connected &&
            blocknative.status.nodeSynced
          ) {
            const eventCode = 'txStallConfirmed'

            handlePreFlightEvent({
              eventCode,
              contractCall,
              balance,
              txDetails: txObject,
              emitter
            })
          }
        }, txStallConfirmedTimeout)
      } else {
        throw new Error(
          'sendTransaction function must resolve to a transaction hash that is of type String.'
        )
      }
    }, 10)
  })
}

function gasEstimates(
  gasFunc: () => Promise<string>,
  gasPriceFunc: () => Promise<string>
) {
  if (!gasFunc || !gasPriceFunc) {
    return Promise.resolve([])
  }

  const gasProm = gasFunc()
  if (!gasProm.then) {
    throw new Error('The `estimateGas` function must return a Promise')
  }

  const gasPriceProm = gasPriceFunc()
  if (!gasPriceProm.then) {
    throw new Error('The `gasPrice` function must return a Promise')
  }

  return Promise.all([gasProm, gasPriceProm])
    .then(([gasResult, gasPriceResult]) => {
      if (typeof gasResult !== 'string') {
        throw new Error(
          `The Promise returned from calling 'estimateGas' must resolve with a value of type 'string'. Received a value of: ${gasResult} with a type: ${typeof gasResult}`
        )
      }

      if (typeof gasPriceResult !== 'string') {
        throw new Error(
          `The Promise returned from calling 'gasPrice' must resolve with a value of type 'string'. Received a value of: ${gasPriceResult} with a type: ${typeof gasPriceResult}`
        )
      }

      return [new BigNumber(gasResult), new BigNumber(gasPriceResult)]
    })
    .catch(error => {
      throw new Error(`There was an error getting gas estimates: ${error}`)
    })
}
