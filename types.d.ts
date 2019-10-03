export as namespace notify

export = init

interface transactionCallback {
  (transactionEvent: object): void
}

interface initializationObject {
  networkId: number
  dappId: string
  transactionListeners?: transactionCallback[]
}

interface transactionOptions {
  sendTransaction: () => any
  estimateGas: () => any
  gasPrice: () => any
  balance: string
  contract: {
    methodName: string
    parameters: any[]
  }
  txDetails: {
    to: string
    value: any
    from: string
  }
}

interface notificationObject {
  type: string
  message: string
  autoDismiss: number
  onclick: () => any
}

interface configOptions {
  mobilePosition: string
  desktopPosition: string
  darkMode: boolean
  txApproveReminderTimeout: number
  txStallPendingTimeout: number
  txStallConfirmedTimeout: number
}

interface notifyApi {
  hash: (hash: string, id?: string) => any
  transaction: (options: transactionOptions) => any
  account: (address: string) => any
  notification: (
    eventCode: string,
    notificationObject: notificationObject
  ) => any
  config: (options: configOptions) => void
}

declare function init(initialize: initializationObject): notifyApi
