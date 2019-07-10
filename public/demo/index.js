let provider

const getEthersProvider = () => {
  if (!provider) {
    if (typeof window.ethereum !== 'undefined') {
      provider = new window.ethers.providers.Web3Provider(window.ethereum)
    } else if (typeof window.web3 !== 'undefined') {
      provider = new window.ethers.providers.Web3Provider(
        window.web3.currentProvider
      )
    } else {
      provider = window.ethers.getDefaultProvider('rinkeby')
    }
  }

  return provider
}

let UncheckedSigner

const getUncheckedSigner = () => {
  if (!UncheckedSigner) {
    const provider = getEthersProvider()
    class UncheckedJsonRpcSigner extends ethers.Signer {
      constructor(signer) {
        super()
        window.ethers.utils.defineReadOnly(this, 'signer', signer)
        window.ethers.utils.defineReadOnly(this, 'provider', signer.provider)
      }

      getAddress() {
        return this.signer.getAddress()
      }

      sendTransaction(transaction) {
        return this.signer.sendUncheckedTransaction(transaction).then(hash => ({
          hash,
          nonce: null,
          gasLimit: null,
          gasPrice: null,
          data: null,
          value: null,
          chainId: null,
          confirmations: 0,
          from: null,
          wait: confirmations =>
            this.provider.waitForTransaction(hash, confirmations)
        }))
      }
    }

    UncheckedSigner = new UncheckedJsonRpcSigner(provider.getSigner())
  }

  return UncheckedSigner
}

window.sendEthersTransaction = async () => {
  await window.ethereum.enable()
  const { hash } = await getUncheckedSigner().sendTransaction({
    to: '0x6A4C1Fc1137C47707a931934c76d884454Ed2915',
    value: 100000000000000
  })

  console.log({ hash })

  // fetch('http://localhost:54100/transaction', {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //     'Access-Control-Allow-Origin': '*'
  //   },
  //   body: JSON.stringify({
  //     apikey: '100',
  //     hash,
  //     blockchain: 'ethereum',
  //     networks: ['rinkeby']
  //   })
  // })

  const emitter = window.notify.transaction(hash)

  // emitter.on('txSent', console.log)
  // emitter.on('txPool', console.log)
  // emitter.on('txConfirmed', console.log)
}
