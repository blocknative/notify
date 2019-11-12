# Notify

A JavaScript library for real time notifications for Ethereum transaction state changes.

## Install

`npm install bnc-notify`

## Quick Start

```javascript
import Notify from 'bnc-notify'
import Web3 from 'web3'

const web3 = new Web3(window.ethereum)

const options = {
  dappId: 'Your dappId here',
  networkId: 1
}

// initialize notify
const notify = Notify(options)

// get users' account address
const accounts = await window.ethereum.enable()

// send a transaction
web3.eth
  .sendTransaction({
    from: accounts[0],
    to: '0x792ec62e6840bFcCEa00c669521F678CE1236705',
    value: '100000'
  })
  // listen for transaction hash
  .on('transactionHash', hash => {
    // pass the hash to notify.hash function for transaction updates and notifications
    const { emitter } = notify.hash(hash)

    // use emitter to listen to transaction events
    emitter.on('txSent', console.log)
    emitter.on('txPool', console.log)
    emitter.on('txConfirmed', console.log)
    emitter.on('txSpeedUp', console.log)
    emitter.on('txCancel', console.log)
    emitter.on('txFailed', console.log)
    emitter.on('all', console.log)
  })
```

## Documentation

For detailed documentation head to [docs.blocknative.com](https://docs.blocknative.com/notify)
