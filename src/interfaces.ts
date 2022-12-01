import type {
  BitcoinTransactionLog,
  EthereumTransactionLog,
  SDKError,
  TransactionHandler,
  System
} from 'bnc-sdk'

export interface InitOptions extends ConfigOptions {
  dappId?: string
  transactionHandler?: TransactionHandler
  name?: string
  apiUrl?: string
  onerror?: ErrorHandler
}

export type ErrorHandler = (error: SDKError) => void

export interface TransactionEvent {
  emitterResult: void | boolean | CustomNotificationObject
  transaction: TransactionData
}

export type TransactionEventCode =
  | 'txSent'
  | 'txPool'
  | 'txStuck'
  | 'txConfirmed'
  | 'txSpeedUp'
  | 'txCancel'
  | 'txFailed'
  | 'txRequest'
  | 'nsfFail'
  | 'txRepeat'
  | 'txAwaitingApproval'
  | 'txConfirmReminder'
  | 'txSendFail'
  | 'txError'
  | 'txUnderPriced'
  | 'all'

export interface TransactionData {
  asset?: string
  blockHash?: string
  blockNumber?: number
  contractCall?: ContractCall | DecodedContractCall
  counterparty?: string
  eventCode?: string
  from?: string
  gas?: string
  gasPrice?: string
  hash?: string
  txid?: string
  id?: string
  input?: string
  monitorId?: string
  monitorVersion?: string
  nonce?: number
  replaceHash?: string
  r?: string
  s?: string
  status?: string
  to?: string
  transactionIndex?: number
  v?: string
  value?: string | number
  startTime?: number
  watchedAddress?: string
  originalHash?: string
  direction?: string
  system?: string
  inputs?: BitcoinInputOutput[]
  outputs?: BitcoinInputOutput[]
  baseFeePerGasGwei?: number
  maxPriorityFeePerGasGwei?: number
  maxFeePerGasGwei?: number
  gasPriceGwei?: number
}

export type NotificationType = 'pending' | 'success' | 'error' | 'hint'

export interface CustomNotificationObject {
  type?: NotificationType
  message?: string
  autoDismiss?: number
  onclick?: (event: any) => void
  eventCode?: string
  link?: string
}

export interface BitcoinInputOutput {
  address: string
  value: string
}

export interface NotificationObject {
  id: string
  type: NotificationType
  key: string
  startTime?: number
  eventCode?: string
  message: string
  autoDismiss?: number
}

export interface ContractCall {
  methodName: string
  params: string[]
}

export interface DecodedContractCall {
  contractAddress?: string
  contractType?: string
  params: object
  methodName: string
}

export interface AppStore {
  version: string
  dappId?: string
  name?: string
  networkId?: number
  nodeSynced: boolean
  onerror?: ErrorHandler
  mobilePosition: 'bottom' | 'top'
  desktopPosition: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
  darkMode: boolean
  txApproveReminderTimeout: number
  txStallPendingTimeout: number
  txStallConfirmedTimeout: number
  clientLocale: string
  notifyMessages: NotifyMessages
}

export interface NotifyMessages {
  [key: string]: LocaleMessages
}

export interface LocaleMessages {
  transaction: {
    [key: string]: string
  }
  watched: {
    [key: string]: string
  }
  time: {
    [key: string]: string
  }
}

export interface TransactionOptions {
  sendTransaction?: () => Promise<string>
  estimateGas?: () => Promise<string>
  gasPrice?: () => Promise<string>
  balance?: string
  contractCall?: ContractCall
  txDetails?: {
    to?: string
    from?: string
    value: string
  }
}

export interface PreflightEvent {
  eventCode: string
  contractCall?: ContractCall
  balance: string
  txDetails?: {
    to?: string
    from?: string
    value: string | number
  }
  emitter: Emitter
  status?: string
}

export interface UpdateNotification {
  (notificationObject: CustomNotificationObject): {
    dismiss: () => void
    update: UpdateNotification
  }
}

export interface ConfigOptions {
  system?: System
  networkId?: number
  mobilePosition?: 'bottom' | 'top'
  desktopPosition?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
  darkMode?: boolean
  txApproveReminderTimeout?: number
  txStallPendingTimeout?: number
  txStallConfirmedTimeout?: number
  notifyMessages?: NotifyMessages
  clientLocale?: string
}

export interface Hash {
  (hash: string, id?: string):
    | never
    | {
        details: BitcoinTransactionLog | EthereumTransactionLog
        emitter: Emitter
      }
}

export interface Transaction {
  (options: TransactionOptions): { result: Promise<string>; emitter: Emitter }
}

export interface Account {
  (address: string): never | { details: { address: string }; emitter: Emitter }
}

export interface Unsubscribe {
  (addressOrHash: string): void
}

export interface Notification {
  (notificationObject: CustomNotificationObject): {
    dismiss: () => void
    update: UpdateNotification
  }
}

export interface Config {
  (options: ConfigOptions): void
}

export interface API {
  hash: Hash
  transaction: Transaction
  account: Account
  unsubscribe: Unsubscribe
  notification: Notification
  config: Config
}

export interface EmitterListener {
  (state: TransactionData): boolean | void | CustomNotificationObject
}

export interface Emitter {
  listeners: {
    [key: string]: EmitterListener
  }
  on: (eventCode: TransactionEventCode, listener: EmitterListener) => void
  emit: (state: TransactionData) => boolean | void | CustomNotificationObject
}

export interface NotificationDetails {
  id: string
  hash?: string
  startTime: number
  eventCode: string
  direction?: string
  counterparty?: string
  value?: string
  asset?: string
}
