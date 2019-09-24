# Notify

## Build

- Clone the repo
- Run `npm install` to install the dependencies
- `npm run build`

## Usage

### Initialize

```javascript
const notify = Notify.init({
  dappId: String, // Your api key - Head to https://www.blocknative.com/ to get a free key
  networkId: Number, // The id of the network your dapp runs on
  transactionEvents: Function // callback that is called for every transaction event with the transaction object and the result from the emitter for that transaction
})
```

### Notifications

register a hash of a transaction to receive notifications for pending and confirmed statuses:

```javascript
const { emitter } = notify.hash(hash)
```

to receive notifications for the full lifecycle of a transaction:

```javascript
const { emitter, id } = notify.transaction({
  sendTransaction: Function, // A function to call to send the transaction
  // if sendTransaction not provided, then an object with id is returned to be passed to notify.hash after you have initiated the transaction yourself
  estimateGas: Function, // A function to call to estimate the gas limit for this transaction (if not passed no sufficient balance check)(must return a string)
  gasPrice: Function, // A funtion to get the current gas price (if not passed, no sufficient balance check)(must return a string)
  balance: String, // The users' current balance (if not passed, no sufficient balance check)(must return a string)
  txDetails: {
    // if not passed no duplicate transaction check
    to: String, // the address the transaction is being sent to
    value: Number || String // the value of the transaction
  }
})
```

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

### Configuration

There are some configuration options available:

```javascript
notify.config({
  darkMode: Boolean, // (default: false)
  mobilePosition: String, // 'top', 'bottom' (default: 'top')
  desktopPosition: String // 'bottomLeft', 'bottomRight', 'topLeft', 'topRight' (default: 'bottomRight')
})
```
