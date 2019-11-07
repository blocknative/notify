import {
  InitOptions,
  TransactionOptions,
  CustomNotificationObject,
  ConfigOptions
} from "./interfaces"

export function validateType({
  name,
  value,
  type,
  optional,
  customValidation
}: {
  name: string
  value: any
  type: string
  optional?: boolean
  customValidation?: (val: any) => boolean
}): never | void {
  if (!optional && typeof value === "undefined") {
    throw new Error(`"${name}" is required`)
  }

  if (
    typeof value !== "undefined" &&
    (type === "array" ? Array.isArray(type) : typeof value !== type)
  ) {
    throw new Error(
      `"${name}" must be of type: ${type}, received type: ${typeof value} from value: ${value}`
    )
  }

  if (
    typeof value !== "undefined" &&
    customValidation &&
    !customValidation(value)
  ) {
    throw new Error(`"${value}" is not a valid "${name}"`)
  }
}

export function validateInit(init: InitOptions): void {
  validateType({ name: "init", value: init, type: "object" })

  const { dappId, networkId, transactionHandler } = init

  validateType({ name: "dappId", value: dappId, type: "string" })
  validateType({ name: "networkId", value: networkId, type: "number" })
  validateType({
    name: "transactionHandler",
    value: transactionHandler,
    type: "function",
    optional: true
  })
}

function stringOrNumber(val: string | number): boolean {
  return typeof val === "string" || typeof val === "number"
}

export function validateTransactionOptions(options: TransactionOptions): void {
  validateType({ name: "transaction options", value: options, type: "object" })

  const {
    sendTransaction,
    estimateGas,
    gasPrice,
    balance,
    contractCall,
    txDetails
  } = options

  validateType({
    name: "sendTransaction",
    value: sendTransaction,
    type: "function",
    optional: true
  })

  validateType({
    name: "estimateGas",
    value: estimateGas,
    type: "function",
    optional: true
  })

  validateType({
    name: "gasPrice",
    value: gasPrice,
    type: "function",
    optional: true
  })

  validateType({
    name: "balance",
    value: balance,
    type: "string",
    optional: true
  })

  validateType({
    name: "contractCall",
    value: contractCall,
    type: "object",
    optional: true
  })

  if (contractCall) {
    const { methodName, params } = contractCall
    validateType({
      name: "methodName",
      value: methodName,
      type: "string",
      optional: true
    })
    validateType({
      name: "params",
      value: params,
      type: "array",
      optional: true
    })
  }

  validateType({
    name: "txDetails",
    value: txDetails,
    type: "object",
    optional: true
  })

  if (txDetails) {
    const { to, value, from } = txDetails

    validateType({
      name: "to",
      value: to,
      type: "string",
      optional: true,
      customValidation: isAddress
    })

    if (typeof value !== "undefined" && !stringOrNumber(value)) {
      throw new Error(
        `"value" must be of type: string | number, received type: ${typeof value} from value: ${value}`
      )
    }

    validateType({
      name: "from",
      value: from,
      type: "string",
      optional: true,
      customValidation: isAddress
    })
  }
}

export function validateNotificationObject(
  notification: CustomNotificationObject | boolean | undefined
): void {
  validateType({
    name: "notification",
    value: notification,
    type: "object"
  })

  if (typeof notification !== "object") return

  const { eventCode, type, message, autoDismiss, onclick } = notification

  validateType({
    name: "eventCode",
    value: eventCode,
    type: "string",
    optional: true
  })

  validateType({
    name: "type",
    value: type,
    type: "string",
    optional: true,
    customValidation: validNotificationType
  })

  validateType({
    name: "message",
    value: message,
    type: "string"
  })

  validateType({
    name: "autoDismiss",
    value: autoDismiss,
    type: "number",
    optional: true
  })

  validateType({
    name: "onclick",
    value: onclick,
    type: "function",
    optional: true
  })
}

export function validateConfig(config: ConfigOptions): void {
  validateType({ name: "config", value: config, type: "object" })

  const {
    mobilePosition,
    desktopPosition,
    darkMode,
    notifyMessages,
    clientLocale,
    txApproveReminderTimeout,
    txStallPendingTimeout,
    txStallConfirmedTimeout
  } = config

  validateType({
    name: "mobilePosition",
    value: mobilePosition,
    type: "string",
    optional: true,
    customValidation: validMobilePosition
  })

  validateType({
    name: "desktopPosition",
    value: desktopPosition,
    type: "string",
    optional: true,
    customValidation: validDesktopPosition
  })

  validateType({
    name: "darkMode",
    value: darkMode,
    type: "boolean",
    optional: true
  })

  validateType({
    name: "notifyMessages",
    value: notifyMessages,
    type: "object",
    optional: true
  })

  if (notifyMessages) {
    Object.keys(notifyMessages).forEach(locale => {
      validateType({
        name: locale,
        value: notifyMessages[locale],
        type: "object"
      })
      const { transaction, watched } = notifyMessages[locale]
      validateType({
        name: `notifyMessages.${locale}.transaction`,
        value: transaction,
        type: "object"
      })
      validateType({
        name: `notifyMessages.${locale}.watched`,
        value: watched,
        type: "object"
      })
    })
  }

  validateType({
    name: "clientLocale",
    value: clientLocale,
    type: "string",
    optional: true
  })

  validateType({
    name: "txApproveReminderTimeout",
    value: txApproveReminderTimeout,
    type: "number",
    optional: true
  })

  validateType({
    name: "txStallPendingTimeout",
    value: txStallPendingTimeout,
    type: "number",
    optional: true
  })

  validateType({
    name: "txStallConfirmedTimeout",
    value: txStallConfirmedTimeout,
    type: "number",
    optional: true
  })
}

function validNotificationType(type: string): boolean {
  switch (type) {
    case "hint":
    case "pending":
    case "error":
    case "success":
      return true
    default:
      return false
  }
}

function validMobilePosition(position: string): boolean {
  return position === "top" || position === "bottom"
}

function validDesktopPosition(position: string): boolean {
  switch (position) {
    case "bottomLeft":
    case "bottomRight":
    case "topLeft":
    case "topRight":
      return true
    default:
      return false
  }
}

function isAddress(address: string): boolean {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address)
}
