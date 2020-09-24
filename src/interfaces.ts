import type {
  BitcoinTransactionLog,
  EthereumTransactionLog
} from 'bnc-sdk/dist/types/src/interfaces'

export interface InitOptions extends ConfigOptions {
  dappId: string
  networkId: number
  transactionHandler?: TransactionHandler
  name?: string
  apiUrl?: string
}

export interface TransactionHandler {
  (transaction: TransactionEvent): void
}

export interface TransactionEvent {
  emitterResult: void | boolean | CustomNotificationObject
  transaction: TransactionData
}

export type System = 'bitcoin' | 'ethereum'

export type TransactionEventCode =
  | 'txSent'
  | 'txPool'
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
  contractCall?: ContractObject
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
}

export type NotificationType = 'pending' | 'success' | 'error' | 'hint'

export interface CustomNotificationObject {
  type?: NotificationType
  message?: string
  autoDismiss?: number
  onclick?: (event: any) => void
  eventCode?: string
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

export interface ContractObject {
  contractAddress?: string
  contractType?: string
  methodName: string
  params: object
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
  sendTransaction: () => Promise<string>
  estimateGas: () => Promise<string>
  gasPrice: () => Promise<string>
  balance: string
  contractCall: ContractObject
  txDetails: {
    to?: string
    value: string
    from?: string
  }
}

export interface PreflightEvent {
  eventCode: string
  contractCall?: ContractObject
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
