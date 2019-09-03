export const transactionMessages = {
  txRequest: "Your transaction is waiting for you to confirm",
  nsfFail: "You have insufficient funds to complete this transaction",
  txUnderpriced:
    "The gas price for your transaction is too low, try again with a higher gas price",
  txRepeat: "This could be a repeat transaction",
  txAwaitingApproval:
    "You have a previous transaction waiting for you to confirm",
  txConfirmReminder:
    "Please confirm your transaction to continue, the transaction window may be behind your browser",
  txSendFail: "You rejected the transaction",
  txSent: "Your transaction has been sent to the network",
  txStallPending:
    "Your transaction has stalled and has not entered the transaction pool",
  txPool: "Your transaction has started",
  txStallConfirmed: "Your transaction has stalled and hasn't been confirmed",
  txSpeedUp: "Your transaction has been sped up",
  txCancel: "Your transaction is being canceled",
  txFailed: "Your transaction has failed",
  txConfirmed: "Your transaction has succeeded",
  txUnderpriced: "The gas limit is set too low to complete this transaction",
  txError: "Oops something went wrong, please try again"
}

export function eventToType(eventCode) {
  switch (eventCode) {
    case "txSent":
    case "txPool":
    case "txSpeedUp":
    case "txCancel":
      return "pending"
    case "txRequest":
    case "txRepeat":
    case "txAwaitingApproval":
    case "txConfirmReminder":
    case "txStallPending":
    case "txStallConfirmed":
      return "hint"
    case "txError":
    case "txSendFail":
    case "txFailed":
    case "txDropped":
    case "nsfFail":
    case "txUnderpriced":
      return "error"
    case "txConfirmed":
      return "success"
    default:
      return "hint"
  }
}

export function eventToMessage(eventCode, direction, counterparty, value) {
  if (!direction || !counterparty) {
    return transactionMessages[eventCode]
  }

  const formattedValue =
    value && value.length > 7 ? value.substring(0, 7) : value

  const counterpartyShort =
    counterparty.substring(0, 4) +
    "..." +
    counterparty.substring(counterparty.length - 4)

  switch (eventCode) {
    case "txPool":
    case "txSpeedUp":
    case "txCancel":
      return `Your account is ${
        direction === "incoming" ? "receiving" : "sending"
      } ${formattedValue ? formattedValue + " ether" : "a transaction"} ${
        direction === "incoming" ? "from" : "to"
      } ${counterpartyShort}`
    case "txConfirmed":
      return `Your account successfully ${
        direction === "incoming" ? "received" : "sent"
      } ${formattedValue ? formattedValue + " ether" : "a transaction"} ${
        direction === "incoming" ? "from" : "to"
      } ${counterpartyShort}`
  }
}

export function typeToDismissTimeout(type) {
  switch (type) {
    case "success":
    case "hint":
      return 4000
    default:
      return false
  }
}
