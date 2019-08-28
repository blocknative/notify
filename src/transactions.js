import { transactions } from "./stores"
import { createNotification } from "./notifications"
import { argsEqual } from "./utilities"

let transactionQueue

transactions.subscribe(store => (transactionQueue = store))

export function handlePreFlightEvent({
  eventCode,
  contract,
  balance,
  txObject,
  listeners,
  blocknative,
  status
}) {
  // log event
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
    contractCall: contract
  }

  const emitterResult =
    listeners[eventCode] && listeners[eventCode](transaction)

  // @TODO - validate emitter result to see if valid notification schema
  // @NOTE - doesn't need to be a complete object, could be just a message param if that is all they want to customize
  // emitterResult && validateNotificationObject(emitterResult)

  handleTransactionEvent({
    transaction: transaction,
    emitterResult
  })
}

export function handleTransactionEvent({ transaction, emitterResult }) {
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

    return (
      sameMethod &&
      sameParams &&
      tx.value == transaction.value &&
      tx.to.toLowerCase() === transaction.to.toLowerCase()
    )
  })

  if (
    duplicate &&
    (duplicate.status === "confirmed" || duplicate.status === "failed")
  ) {
    duplicate = false
  }

  return duplicate
}
