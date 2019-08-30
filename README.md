# Notify

## Run Locally

- Clone the repo
- Run `yarn` to install the dependencies
- Run `yarn dev` to start the development server
- Navigate to `localhost:5000`

## Build

- `yarn build`
- The built libary is located at `/public/bundle.js`

## Using Notify in a Dapp

### Importing with Script Tag

- Drag the built `bundle.js` file in to your public folder
- Link to it via a script tag in the body of your HTML
- Library will be available on the window object: `window.Notify`

### Importing with JS Bundler

- Drag the built `bundle.js` file in to your src folder
- Import it into the file you would like to use it in: `import Notify from './notify`

### Usage

#### Initialize

```javascript
const notify = Notify.init({
  dappId: String,
  networkId: Number
})
```

#### Notifications

via an account address:

```javascript
const { emitter } = notify.account(address)
```

via a transaction hash:

```javascript
const { emitter } = notify.hash(hash)
```

to receive preflight notifications:

```javascript
const { emitter, sendTransactionResult } = notify.transaction({
  sendTransaction: Function, // A function to call to send the transaction
  // if sendTransaction not provided, then an object with id is returned to be passed to notify.hash after you have initiated the transaction yourself
  estimateGas: Function, // A function to call to estimate the gas limit for this transaction (if not passed no sufficient balance check)
  gasPrice: Function, // A funtion to get the current gas price (if not passed no sufficient balance check)
  balance: String, // The users' current balance (if not passed no sufficient balance check)
  txDetails: Object, // The "to" and "value" properties that the transaction is going to be initiated with (if not passed no duplicate transaction check)
  listeners: Object // Key pairs of eventCode to listener function (same function structure as emitter callback)
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
```
