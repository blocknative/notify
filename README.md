# Notify

A JavaScript library for real time notifications for Ethereum transactions

- [Quick Start Examples](#quick-start-examples)
  - [web3.js - `0.2.x`](#web3-0.2.x-example)
  - [web3.js - `1.x.x`](#web3-1.x.x-example)
  - [ethers.js - `v4`](#ethers-v4-example)
  - [ethers.js - `v5`](#ethers-v5-example)
- [API](#api)

## Quick Start Examples

### web3 0.2.x example

### web3 1.x.x example

### ether v4 example

### ethers v5 example

### API

### Initialization

```javascript
import Notify from "bn-notify"

const options = {
  dappId: "Your dappId here",
  networkId: "1",
  transactionEvents: event =>
    console.log("Transaction Event:", event.transaction)
}

const notify = Notify(options)
```

#### Options

```javascript
const options = {
  dappId: String,
  networkId: Number,
  transactionEvents: Function
}
```

##### `dappId` - [REQUIRED]

Your unique apiKey that identifies your application. You can generate a dappId by visiting the [Blocknative account page](https://account.blocknative.com/) and create a free account.

##### `networkId` - [REQUIRED]

The Ethereum network id that your application runs on. The following values are valid:

- `'1'` Main Network
- `'3'` Ropsten Test Network
- `'4'` Rinkeby Test Network
- `'5'` Goerli Test Network
- `'42'` Kovan Test Network

##### `transactionEvents` - [OPTIONAL]

The function defined for the `transactionEvents` parameter will be called once for every status update for _every_ transaction that is associated with a watched address _or_ a watched transaction. This is useful as a global handler for all transactions and status updates. The callback is called with the following object:

```javascript
{
  transaction, // transaction object
    emitterResult // data that is returned from the transaction event listener defined on the emitter
}
```

See the [Transaction Object](#transaction-object) section for more info on what is included in the `transaction` parameter.

### `notify.hash`

To get notifications for every status that occurs after sending a transaction ("post-flight"), use the `hash` function:

```javascript
// send the transaction using web3.js and get the hash
const hash = await web3.eth.sendTransaction(txOptions)

// pash the hash in to notify.hash
const { emitter } = notify.hash(hash)
```

Check out the [Emitter Section](#emitter) for details on the `emitter` object

### `notify.transaction`

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

#### Emitter

The `emitter` object returned is used to listen for transaction events:

```javascript
emitter.on("txRepeat", transaction => {
  // return false for no notification
  // no return (or return undefined) to show default notification
  // return custom transaction object to show custom transaction, can return all or one of the following parameters:
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

#### Event Codes

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
- `txDropped`: Transaction was dropped from the mempool without being added to a block

### `notify.config`

There are some configuration options available:

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
