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

export function typeToDismissTimeout(type) {
  switch (type) {
    case "success":
    case "hint":
      return 4000
    default:
      return false
  }
}
