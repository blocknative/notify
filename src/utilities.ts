import type {
  Emitter,
  EmitterListener,
  TransactionData,
  TransactionEventCode
} from './interfaces'

export function argsEqual(args1: any, args2: any): boolean {
  return JSON.stringify(args1) === JSON.stringify(args2)
}

// will update object(merge new data) in list if it passes predicate, otherwise adds new object
export function replaceOrAdd(
  list: any[],
  predicate: (val: any) => boolean,
  data: any
): any[] {
  const clone = [...list]
  const index = clone.findIndex(predicate)

  if (index !== -1) {
    const { startTime, contractCall, status } = clone[index]

    // if current transaction is a speedup or cancel and new status is pending, ignore update
    if (
      data.status === 'pending' &&
      (status === 'speedup' || status === 'cancel')
    ) {
      return clone
    }

    const { startTime: serverStartTime } = data
    const contractCallMerge = contractCall ? { ...contractCall } : {}

    clone[index] = {
      ...data,
      ...contractCallMerge,
      startTime: startTime || serverStartTime
    }
    return clone
  }

  return [...list, data]
}

export function extractMessageFromError(error: {
  message: string
  stack: string
}): { eventCode: string; errorMsg: string } {
  if (!error.stack || !error.message) {
    return {
      eventCode: 'txError',
      errorMsg: 'An unknown error occured'
    }
  }

  const message = error.stack || error.message

  if (message.includes('User denied transaction signature')) {
    return {
      eventCode: 'txSendFail',
      errorMsg: 'User denied transaction signature'
    }
  }

  if (message.includes('transaction underpriced')) {
    return {
      eventCode: 'txUnderpriced',
      errorMsg: 'Transaction is under priced'
    }
  }

  return {
    eventCode: 'txError',
    errorMsg: message
  }
}

export function createEmitter(): Emitter {
  return {
    listeners: {},
    on: function (
      eventCode: TransactionEventCode,
      listener: EmitterListener
    ): never | void {
      // check if valid eventCode
      switch (eventCode) {
        case 'txSent':
        case 'txPool':
        case 'txConfirmed':
        case 'txSpeedUp':
        case 'txCancel':
        case 'txFailed':
        case 'txRequest':
        case 'nsfFail':
        case 'txRepeat':
        case 'txAwaitingApproval':
        case 'txConfirmReminder':
        case 'txSendFail':
        case 'txError':
        case 'txUnderPriced':
        case 'all':
          break
        default:
          throw new Error(
            `${eventCode} is not a valid event code, for a list of valid event codes see: https://github.com/blocknative/notify`
          )
      }

      // check that listener is a function
      if (typeof listener !== 'function') {
        throw new Error('Listener must be a function')
      }

      // add listener for the eventCode
      this.listeners[eventCode] = listener
    },
    emit: function (state: TransactionData) {
      if (this.listeners[state.eventCode || '']) {
        return this.listeners[state.eventCode || ''](state)
      }

      if (this.listeners.all) {
        return this.listeners.all(state)
      }
    }
  }
}

export function localNetwork(networkId: number) {
  switch (networkId) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 42:
    case 56:
    case 100:
    case 137:
      return false
    default:
      return true
  }
}
