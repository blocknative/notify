# Notify

A JavaScript library for real time notifications for Ethereum transactions

## Install

`npm install bnc-notify`

## Quick Start

```javascript
import Notify from "bnc-notify"
import web3 from "./web3"

const options = {
  dappId: "Your dappId here",
  networkId: 1,
  transactionHandler: event =>
    console.log("Transaction Event:", event.transaction)
}

// initialize notify
const notify = Notify(options)

// get users' account address
const accounts = await window.ethereum.enable()

// pass the account address in to notify to receive "post-flight" notifications for every incoming and outgoing transaction that happens on the users' account
const { emitter } = notify.account(accounts[0])

// listen to transaction events
emitter.on("txSent", console.log)
emitter.on("txPool", console.log)
emitter.on("txConfirmed", console.log)
emitter.on("txSpeedUp", console.log)
emitter.on("txCancel", console.log)
emitter.on("txFailed", console.log)
emitter.on("all", console.log)
```

## Initialization

```javascript
import Notify from "bn-notify"

const options = {
  dappId: "Your dappId here",
  networkId: 1,
  transactionHandler: event =>
    console.log("Transaction Event:", event.transaction)
}

const notify = Notify(options)
```

### Options

```javascript
const options = {
  dappId: String,
  networkId: Number,
  transactionHandler: Function
}
```

#### `dappId` - [REQUIRED]

Your unique apiKey that identifies your application. You can generate a dappId by visiting the [Blocknative account page](https://account.blocknative.com/) and create a free account.

#### `networkId` - [REQUIRED]

The Ethereum network id that your application runs on. The following values are valid:

- `1` Main Network
- `3` Ropsten Test Network
- `4` Rinkeby Test Network
- `5` Goerli Test Network
- `42` Kovan Test Network

#### `transactionHandler` - [OPTIONAL]

The function defined for the `transactionHandler` parameter will be called once for every status update for _every_ transaction that is associated with a watched address _or_ a watched transaction. This is useful as a global handler for all transactions and status updates. The callback is called with the following object:

See the [Transaction Object](#transaction-object) section for more info on what is included in the `transaction` parameter.

## API

### `hash`

To get notifications for every status that occurs after sending a transaction ("post-flight"), use the `hash` function:

```javascript
// send the transaction using web3.js and get the hash
const hash = await web3.eth.sendTransaction(txOptions)

// pash the hash in to notify.hash
const { emitter } = notify.hash(hash)
```

Check out the [Emitter Section](#emitter) for details on the `emitter` object

### `account`

To get notifications for every "post-flight" status update for every transaction that occurs on a particular address, use the `account` function:

```javascript
// get the users' account address
const accounts = await window.ethereum.enable()

// pash the hash in to notify.hash
const { emitter } = notify.account(accounts[0])
```

Check out the [Emitter Section](#emitter) for details on the `emitter` object

### `transaction`

To get notifications for every status that occurs for the full transaction lifecycle ("pre-flight" and "post-flight"), use the `transaction` function:

```javascript
const { emitter, result } = notify.transaction({
  estimateGas: Function,
  gasPrice: Function,
  balance: String,
  txDetails: {
    to: String,
    value: Number || String
  },
  sendTransaction: Function
})
```

`result` is a promise that resolves with the `id` of the transaction or rejects with an error if there was an error initiating the transaction. The `id` is useful for when you would like to initiate the transaction yourself and didn't pass a `sendTransaction` function in to `transaction`. You can then send the transaction yourself, receive the hash, and then call `notify.hash(hash, id)`. By passing in the `id` to `hash` you enable notify to link the preflight notifications to the post send transaction notifications, ensuring a consistent UX.

The `transaction` function takes an object as the argument which allows you to progressively opt in to which checks and corresponding notifications that you would like during the "pre-flight" phase of the transaction lifecycle. Below is a list of the parameters, what is expected for each of those parameters, and the corresponding notifications you will get by including those parameters:

#### `estimateGas` - [balance check notification]

The `estimateGas` function must return a `Promise` that resolves with a `String` that is the gas estimate in `wei`. This function can vary depending on whether it is a contract transaction or just a regular send transaction call.

#### `gasPrice` - [balance check notification]

The `gasPrice` function must return a `Promise` that resolves with a `String` that is the gas price in `wei`.

#### `balance` - [balance check notification]

The users' balance in `wei`

#### `txDetails` - [repeat transaction check notification]

The `txDetails` object includes a `to` parameter which is the address the transaction is being sent to and the `value` parameter, which is the value of the transaction.

#### `sendTransaction` - [send transaction error, approval reminder, and stall notifications]

The `sendTransaction` function must return a `Promise` that resolves with a `String` that is the transaction hash.

### `notification`

You may want to trigger a notification for a custom event that may not be related to a transaction. You can use the `notification` function to do that:

```javascript
const notificationObject = {
  eventCode: "dbUpdate"
  type: "pending",
  message: "Updating the database with your information"
}

const { update, dismiss } = notify.notification(notificationObject)

//.... somewhere else in your code

if (dbUpdated) {
  update({
    eventCode: "dbUpdateComplete"
    type: "success",
    message: "Your info is up to date!"
  })
} else {
  update({
    eventCode: "dbUpdateSlow"
    type: "pending",
    message: "Database update is taking longer than usual, hang in there!"
  })
}
```

The `notification` function is called with a notification object with the following parameters:

- `eventCode`: a string which is used to keep track of that event for your analytics dashboard
- `type`: a string that defines the style - ['hint' (gray), 'pending' (yellow), 'success' (green), 'error' (red)]
- `message`: a message string that is displayed on the notification
- `autoDismiss`: a number in milliseconds before the notification auto dismisses or `false` for no auto dismissal. `success` and `hint` types default to `4000`

Returned from the notification function is an object that has two functions defined on it:

- `update`: a function that can be called with a new notification object to replace the original notification with
- `dismiss`: a function that can be called to dismiss the notification manually

### `config`

There are some configuration options available which can be updated by calling the `config` function:

```javascript
notify.config({
  darkMode: Boolean, // (default: false)
  mobilePosition: String, // 'top', 'bottom' (default: 'top')
  desktopPosition: String, // 'bottomLeft', 'bottomRight', 'topLeft', 'topRight' (default: 'bottomRight')
  txApproveReminderTimeout: Number, // (default: 20000)
  txStallPendingTimeout: Number, // (default: 20000)
  txStallConfirmedTimeout: Number // (default: 90000)
})
```

## Emitter

The `emitter` object returned is used to listen for transaction events:

```javascript
emitter.on("txRepeat", transaction => {
  // return false for no notification
  // no return (or return undefined) to show default notification
  // return custom notification object to show custom notifications, can return all or one of the following parameters:
  return {
    type: String, // ['hint' (gray), 'pending' (yellow), 'success' (green), 'error' (red)]
    message: String, // The message you would like to display
    autoDismiss: Number // The number of milliseconds before the notification automatically hides or false for no autodismiss
  }
})

// You can also use the `all` event to register a listener for all events for that transaction. The `all` listener will only be called if there isn't a listener defined for the particular event:

emitter.on("all", transaction => {
  // called on every event that doesn't have a listener defined on this transaction
})
```

## Event Codes

The following event codes are valid events to listen to on the transaction emitter:

- `txRequest`: Transaction has been initiated and is waiting approval from the user
- `txRepeat`: Transaction has the same value and to address, so may be a repeat transaction
- `txAwaitingApproval`: A previous transaction is awaiting approval
- `txConfirmReminder`: Transaction has not been confirmed after timeout
- `txStallPending`: Transaction has not been received in the txPool after timeout
- `txStallConfirmed`: Transaction has been in the txPool for longer than the timeout
- `txError`: An error has occured with the transaction
- `txSendFail`: The user rejected the transaction
- `txUnderpriced`: The gas was set too low for the transaction to complete
- `txPool`: Transaction is in the mempool and is pending
- `txConfirmed`: Transaction has been mined
- `txFailed`: Transaction has failed
- `txSpeedUp`: A new transaction has been submitted with the same nonce and a higher gas price, replacing the original transaction
- `txCancel`: A new transaction has been submitted with the same nonce, a higher gas price, a value of zero and sent to an external address (not a contract)
- `txDropped`: Transaction was dropped from the mempool without being added to a block. _NOTE: Transaction could reappear in mempool._
