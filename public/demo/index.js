let provider

const getEthersProvider = () => {
  if (!provider) {
    if (typeof window.ethereum !== "undefined") {
      provider = new window.ethers.providers.Web3Provider(window.ethereum)
    } else if (typeof window.web3 !== "undefined") {
      provider = new window.ethers.providers.Web3Provider(
        window.web3.currentProvider
      )
    } else {
      provider = window.ethers.getDefaultProvider("rinkeby")
    }
  }

  return provider
}

let signer

const getUncheckedSigner = () => {
  if (!signer) {
    provider = getEthersProvider()
    class UncheckedJsonRpcSigner extends ethers.Signer {
      constructor(signer) {
        super()
        window.ethers.utils.defineReadOnly(this, "signer", signer)
        window.ethers.utils.defineReadOnly(this, "provider", signer.provider)
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

    signer = new UncheckedJsonRpcSigner(provider.getSigner())
  }

  return signer
}

window.sendHash = async () => {
  await window.ethereum.enable()
  const signer = getUncheckedSigner()
  const { hash } = await signer.sendTransaction({
    to: "0x6A4C1Fc1137C47707a931934c76d884454Ed2915",
    value: 100000000000000
  })

  const emitter = window.notify.hash(hash)
}

window.sendTransaction = async () => {
  const accounts = await window.ethereum.enable()
  const signer = getUncheckedSigner()
  const balance = await provider
    .getBalance(accounts[0])
    .then(res => res.toString())
  const txDetails = {
    to: "0x6A4C1Fc1137C47707a931934c76d884454Ed2915",
    // value: 9000000000000000
    value: 10000
  }
  const sendTransaction = () => signer.sendTransaction(txDetails)
  const estimateGas = () =>
    provider.estimateGas(txDetails).then(res => res.toString())
  const gasPrice = () => provider.getGasPrice().then(res => res.toString())
  const listeners = {
    txRequest: tx => console.log(tx.eventCode),
    nsfFail: tx => console.log(tx.eventCode),
    txRepeat: tx => console.log(tx.eventCode),
    txAwaitingApproval: tx => console.log(tx.eventCode),
    txConfirmReminder: tx => console.log(tx.eventCode),
    txSendFail: tx => console.log(tx.eventCode)
  }

  const { emitter } = await window.notify.transaction({
    sendTransaction,
    estimateGas,
    gasPrice,
    balance,
    txDetails,
    listeners
  })

  emitter &&
    emitter.on("txConfirmed", () => ({
      message: "Congratulations on a successful transaction!"
    }))
}
