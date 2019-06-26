export const createEmitter = id => ({
  id,
  listeners: {},
  on: function(event, listener) {
    this.listeners[event] = listener
  }
})

export function networkName(id) {
  switch (id) {
    case 1:
      return 'main'
    case 3:
      return 'ropsten'
    case 4:
      return 'rinkeby'
    case 42:
      return 'kovan'
    case 'localhost':
      return 'localhost'
    default:
      return 'local'
  }
}

export function getItem(item) {
  let storageItem
  try {
    storageItem = window.localStorage && window.localStorage.getItem(item)
  } catch (errorObj) {
    return 'null'
  }
  return storageItem
}

export function storeItem(item, value) {
  try {
    window.localStorage && window.localStorage.setItem(item, value)
  } catch (errorObj) {
    return 'null'
  }
  return 'success'
}

export function eventToType(eventCode) {
  switch (eventCode) {
    case 'txSent':
    case 'txPool':
      return 'pending'
    case 'txFail':
      return 'error'
    case 'txConfirmed':
      return 'success'
  }
}

const eventToMessage = {
  txRequest: 'Your transaction is waiting for you to confirm',
  txPool: 'Your transaction has started',
  txSent: 'Your transaction has been sent to the network',
  txSendFail: 'You rejected the transaction',
  txStall: 'Your transaction has stalled',
  txFailed: 'Your transaction has failed',
  nsfFail: 'You have insufficient funds to complete this transaction',
  txRepeat: 'This could be a repeat transaction',
  txAwaitingApproval:
    'You have a previous transaction waiting for you to confirm',
  txConfirmReminder:
    'Please confirm your transaction to continue (hint: the transaction window may be behind your browser)',
  txConfirmed: 'Your transaction has succeeded',
  txSpeedUp: 'Your transaction has been sped up',
  txCancel: 'Your transaction is being canceled'
}

export function eventToDismissTimeout(eventCode) {
  switch (eventCode) {
    case 'txSent':
    case 'txPool':
    case 'txFail':
      return false
    case 'txConfirmed':
      return 4000
  }
}

export function createDefaultNotification({ id, timestamp, eventCode }) {
  return {
    id,
    type: eventToType(eventCode),
    timestamp,
    message: eventToMessage[eventCode],
    autoDismiss: eventToDismissTimeout(eventCode)
  }
}

export function withoutProps(props, obj) {
  return Object.keys(obj).reduce((newObj, key) => {
    if (!props.includes(key)) {
      newObj[key] = obj[key]
    }

    return newObj
  }, {})
}

export function timeString(time) {
  const seconds = Math.floor(time / 1000)
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min` : `${seconds} sec`
}

// Nice time format
export function formatTime(number) {
  const time = new Date(number)
  return time.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })
}
