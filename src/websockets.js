import { app, removeTransactionNotification, updateTransaction } from './stores'
import { networkName, getItem, storeItem } from './utilities'

let socketState = {
  pendingSocketConnection: false,
  socketConnection: false
}

// Create websocket connection
export function openWebSocketConnection() {
  return new Promise((resolve, reject) => {
    socketState.pendingSocketConnection = true

    let socket
    try {
      socket = new WebSocket('ws://localhost:54100/v0')
    } catch (errorObj) {
      socketState.pendingSocketConnection = false
      reject(false)
    }

    socket.addEventListener('message', handleSocketMessage)

    socket.addEventListener(
      'close',
      () => (socketState.socketConnection = false)
    )

    socket.addEventListener('error', () => {
      socketState.pendingSocketConnection = false
      reject(false)
    })

    socket.addEventListener('open', () => {
      socketState = {
        socket,
        socketConnection: true,
        pendingSocketConnection: false
      }

      const connectionId = getItem('connectionId')

      logEvent({
        categoryCode: 'initialize',
        eventCode: 'checkDappId',
        connectionId
      })

      resolve(true)
    })
  })
}

export function checkForSocketConnection() {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!socketState.socketConnection) {
        resolve(false)
      }
      resolve(true)
    }, 250)
  })
}

export function retryLogEvent(logFunc) {
  openWebsocketConnection()
    .then(logFunc)
    .catch(() => setTimeout(logFunc, 250))
}

let eventBoilerPlate = {
  dappId: null,
  version: null,
  blockchain: {
    system: 'ethereum',
    network: null
  }
}

app.subscribe(({ version, dappId, networkId }) => {
  eventBoilerPlate = { ...eventBoilerPlate, version, dappId }
  eventBoilerPlate.blockchain.network = networkName(networkId)
})

function createEventLog(eventObj) {
  return JSON.stringify({
    ...eventBoilerPlate,
    ...eventObj,
    timeStamp: new Date()
  })
}

// Log events to server
export function logEvent(eventObj) {
  const eventLog = createEventLog(eventObj)
  const { socket, socketConnection } = socketState

  socketConnection && socket.send(eventLog)

  // Need to check if connection dropped
  // as we don't know until after we try to send a message
  checkForSocketConnection().then(
    connected => !connected && retryLogEvent(() => logEvent(eventObj))
  )
}

// // Handle incoming socket messages
export function handleSocketMessage(msg) {
  const { status, reason, event, connectionId, watchedAccounts } = JSON.parse(
    msg.data
  )
  if (connectionId) {
    storeItem('connectionId', connectionId)
  }

  if (watchedAccounts) {
    app.update(store => ({ ...store, watchedAccounts }))
  }

  // handle any errors from the server
  if (status === 'error') {
    if (
      reason.includes('not a valid API key') &&
      event.eventCode !== 'initFail'
    ) {
      throw new Error(reason)
    }

    if (
      reason.includes('network not supported') &&
      event.eventCode !== 'initFail'
    ) {
      throw new Error(reason)
    }
  }

  if (event && event.transaction) {
    const { transaction, eventCode } = event

    console.log({ eventCode, transaction })

    // remove old notification
    removeTransactionNotification(transaction.id)

    // update transaction in store
    updateTransaction(transaction, eventCode)
  }
}
