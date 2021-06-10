import type {
  InitOptions,
  TransactionOptions,
  CustomNotificationObject,
  ConfigOptions
} from './interfaces'

const validInitKeys = [
  'dappId',
  'networkId',
  'system',
  'transactionHandler',
  'name',
  'onerror',
  'mobilePosition',
  'desktopPosition',
  'darkMode',
  'txApproveReminderTimeout',
  'txStallPendingTimeout',
  'txStallConfirmedTimeout',
  'notifyMessages',
  'clientLocale'
]

const validNotificationKeys = [
  'eventCode',
  'type',
  'message',
  'autoDismiss',
  'onclick'
]

const validTransactionKeys = [
  'sendTransaction',
  'estimateGas',
  'gasPrice',
  'balance',
  'contractCall',
  'txDetails'
]

function invalidParams(
  params: any,
  validParams: string[],
  functionName: string
): void | never {
  const invalid = Object.keys(params)

  if (invalid.length > 0) {
    throw new Error(
      `${
        invalid[0]
      } is not a valid parameter for ${functionName}, must be one of the following valid parameters: ${validParams.join(
        ', '
      )}`
    )
  }
}

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
  customValidation?: (val: any) => void | never
}): never | void {
  if (!optional && typeof value === 'undefined') {
    throw new Error(`"${name}" is required`)
  }

  if (
    typeof value !== 'undefined' &&
    (type === 'array' ? Array.isArray(type) : typeof value !== type)
  ) {
    throw new Error(
      `"${name}" must be of type: ${type}, received type: ${typeof value} from value: ${value}`
    )
  }

  if (typeof value !== 'undefined' && customValidation) {
    customValidation(value)
  }
}

export function validateInit(init: InitOptions): void {
  validateType({ name: 'init', value: init, type: 'object' })

  const {
    dappId,
    system,
    networkId,
    transactionHandler,
    name,
    apiUrl,
    onerror,
    ...otherParams
  } = init

  validateType({
    name: 'dappId',
    value: dappId,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'system',
    value: system,
    type: 'string',
    // defaults to ethereum so optional
    optional: true
  })

  // if no dappId provided then optional, otherwise required
  validateType({
    name: 'networkId (if dappId provided)',
    value: networkId,
    type: 'number',
    optional: !dappId
  })

  validateType({ name: 'name', value: name, type: 'string', optional: true })

  validateType({
    name: 'apiUrl',
    value: apiUrl,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'transactionHandler',
    value: transactionHandler,
    type: 'function',
    optional: true
  })

  validateType({
    name: 'onerror',
    value: onerror,
    type: 'function',
    optional: true
  })

  validateConfig(otherParams)
}

function stringOrNumber(val: string | number): boolean {
  return typeof val === 'string' || typeof val === 'number'
}

export function validateTransactionOptions(options: TransactionOptions): void {
  validateType({ name: 'transaction options', value: options, type: 'object' })

  const {
    sendTransaction,
    estimateGas,
    gasPrice,
    balance,
    contractCall,
    txDetails,
    ...otherParams
  } = options

  invalidParams(otherParams, validTransactionKeys, 'Transaction Options')

  validateType({
    name: 'sendTransaction',
    value: sendTransaction,
    type: 'function',
    optional: true
  })

  validateType({
    name: 'estimateGas',
    value: estimateGas,
    type: 'function',
    optional: true
  })

  validateType({
    name: 'gasPrice',
    value: gasPrice,
    type: 'function',
    optional: true
  })

  validateType({
    name: 'balance',
    value: balance,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'contractCall',
    value: contractCall,
    type: 'object',
    optional: true
  })

  if (contractCall) {
    const { methodName, params, ...otherParams } = contractCall
    invalidParams(otherParams, ['methodName', 'params'], 'contractCall')

    validateType({
      name: 'methodName',
      value: methodName,
      type: 'string',
      optional: true
    })

    validateType({
      name: 'params',
      value: params,
      type: 'array',
      optional: true
    })
  }

  validateType({
    name: 'txDetails',
    value: txDetails,
    type: 'object',
    optional: true
  })

  if (txDetails) {
    const { to, value, from, ...otherParams } = txDetails

    invalidParams(otherParams, ['to', 'value', 'from'], 'txDetails')

    validateType({
      name: 'to',
      value: to,
      type: 'string',
      optional: true,
      customValidation: isAddress
    })

    if (typeof value !== 'undefined' && !stringOrNumber(value)) {
      throw new Error(
        `"value" must be of type: string | number, received type: ${typeof value} from value: ${value}`
      )
    }

    validateType({
      name: 'from',
      value: from,
      type: 'string',
      optional: true,
      customValidation: isAddress
    })
  }
}

export function validateNotificationObject(
  notification: CustomNotificationObject | boolean | undefined
): void {
  validateType({
    name: 'notification',
    value: notification,
    type: 'object'
  })

  if (typeof notification !== 'object') return

  const {
    eventCode,
    type,
    message,
    autoDismiss,
    onclick,
    ...otherParams
  } = notification

  invalidParams(otherParams, validNotificationKeys, 'notification')

  validateType({
    name: 'eventCode',
    value: eventCode,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'type',
    value: type,
    type: 'string',
    optional: true,
    customValidation: validNotificationType
  })

  validateType({
    name: 'message',
    value: message,
    type: 'string'
  })

  validateType({
    name: 'autoDismiss',
    value: autoDismiss,
    type: 'number',
    optional: true
  })

  validateType({
    name: 'onclick',
    value: onclick,
    type: 'function',
    optional: true
  })
}

export function validateConfig(config: ConfigOptions): void {
  validateType({ name: 'config', value: config, type: 'object' })

  const {
    networkId,
    system,
    mobilePosition,
    desktopPosition,
    darkMode,
    notifyMessages,
    clientLocale,
    txApproveReminderTimeout,
    txStallPendingTimeout,
    txStallConfirmedTimeout,
    ...otherParams
  } = config

  invalidParams(otherParams, validInitKeys, 'config / initialize')

  validateType({
    name: 'networkId',
    value: networkId,
    type: 'number',
    optional: true
  })

  validateType({
    name: 'system',
    value: system,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'mobilePosition',
    value: mobilePosition,
    type: 'string',
    optional: true,
    customValidation: validMobilePosition
  })

  validateType({
    name: 'desktopPosition',
    value: desktopPosition,
    type: 'string',
    optional: true,
    customValidation: validDesktopPosition
  })

  validateType({
    name: 'darkMode',
    value: darkMode,
    type: 'boolean',
    optional: true
  })

  validateType({
    name: 'notifyMessages',
    value: notifyMessages,
    type: 'object',
    optional: true
  })

  if (notifyMessages) {
    Object.keys(notifyMessages).forEach(locale => {
      validateType({
        name: locale,
        value: notifyMessages[locale],
        type: 'object'
      })

      const { transaction, watched, time, ...otherParams } = notifyMessages[
        locale
      ]

      invalidParams(otherParams, ['transaction', 'watched', 'time'], locale)

      validateType({
        name: `notifyMessages.${locale}.transaction`,
        value: transaction,
        type: 'object',
        optional: true
      })

      validateType({
        name: `notifyMessages.${locale}.watched`,
        value: watched,
        type: 'object',
        optional: true
      })

      validateType({
        name: `notifyMessages.${locale}.time`,
        value: time,
        type: 'object',
        optional: true
      })
    })
  }

  validateType({
    name: 'clientLocale',
    value: clientLocale,
    type: 'string',
    optional: true
  })

  validateType({
    name: 'txApproveReminderTimeout',
    value: txApproveReminderTimeout,
    type: 'number',
    optional: true
  })

  validateType({
    name: 'txStallPendingTimeout',
    value: txStallPendingTimeout,
    type: 'number',
    optional: true
  })

  validateType({
    name: 'txStallConfirmedTimeout',
    value: txStallConfirmedTimeout,
    type: 'number',
    optional: true
  })
}

function validNotificationType(type: string): void | never {
  switch (type) {
    case 'hint':
    case 'pending':
    case 'error':
    case 'success':
      return
    default:
      throw new Error(
        `${type} is not a valid notification type, must be one of: 'hint', 'pending', 'error' or 'success'.`
      )
  }
}

function validMobilePosition(position: string): void | never {
  switch (position) {
    case 'top':
    case 'bottom':
      return
    default:
      throw new Error(
        `${position} is not a valid mobile notification position, must be one of: 'top' or 'bottom'.`
      )
  }
}

function validDesktopPosition(position: string): void | never {
  switch (position) {
    case 'bottomLeft':
    case 'bottomRight':
    case 'topLeft':
    case 'topRight':
      return
    default:
      throw new Error(
        `${position} is not a valid desktop notification position, must be one of: 'bottomLeft', 'bottomRight', 'topLeft' or 'topRight'.`
      )
  }
}

function isAddress(address: string): void | never {
  if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`${address} is not a valid ethereum address.`)
  }
}
