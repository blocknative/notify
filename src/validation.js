import ow from "ow"

export function validateInit(init) {
  ow(
    init,
    "Initialization Options",
    ow.object.exactShape({
      dappId: ow.string,
      networkId: ow.number,
      transactionEvents: ow.optional.function
    })
  )
}

function stringOrNumber(val) {
  return (
    typeof val === "string" ||
    typeof val === "number" ||
    `${val} is not a valid string or number`
  )
}

export function validateTransactionOptions(options) {
  ow(
    options,
    "Transaction Options",
    ow.object.exactShape({
      sendTransaction: ow.optional.function,
      estimateGas: ow.optional.function,
      gasPrice: ow.optional.function,
      balance: ow.optional.string,
      contract: ow.optional.object.exactShape({
        methodName: ow.string,
        parameters: ow.optional.array.nonEmpty
      }),
      txDetails: ow.optional.object.exactShape({
        to: ow.optional.string,
        value: stringOrNumber,
        from: ow.optional.string
      })
    })
  )
}

export function validateNotificationObject(notification) {
  ow(
    notification,
    "notification",
    ow.object.exactShape({
      eventCode: ow.optional.string,
      type: ow.optional.string.is(validNotificationType),
      message: ow.string,
      autoDismiss: ow.optional.number,
      onclick: ow.optional.function
    })
  )
}

export function validateConfig(config) {
  ow(
    config,
    "config",
    ow.object.exactShape({
      mobilePosition: ow.optional.string.is(validMobilePosition),
      desktopPosition: ow.optional.string.is(validDesktopPosition),
      darkMode: ow.optional.boolean,
      txApproveReminderTimeout: ow.optional.number,
      txStallPendingTimeout: ow.optional.number,
      txStallConfirmedTimeout: ow.optional.number
    })
  )
}

function validNotificationType(type) {
  switch (type) {
    case "hint":
    case "pending":
    case "error":
    case "success":
      return true
    default:
      return `${type} is not a valid notification type`
  }
}

function validMobilePosition(position) {
  return (
    position === "top" ||
    position === "bottom" ||
    `${position} is not a valid mobile notification position`
  )
}

function validDesktopPosition(position) {
  switch (position) {
    case "bottomLeft":
    case "bottomRight":
    case "topLeft":
    case "topRight":
      return true
    default:
      return `${position} is not a valid desktop notification position`
  }
}
