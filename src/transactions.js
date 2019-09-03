import { transactions } from "./stores"
import { createNotification } from "./notifications"
import { argsEqual } from "./utilities"
import { validateNotificationObject } from "./validation"

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
