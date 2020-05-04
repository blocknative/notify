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
}

export interface CustomNotificationObject {
  type?: 'pending' | 'success' | 'error' | 'hint'
  message?: string
  autoDismiss?: number
  onclick?: (event: any) => void
  eventCode?: string
}

export interface NotificationObject {
  id?: string
  type: 'pending' | 'success' | 'error' | 'hint'
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

export interface AppStore {
  version: string
  dappId: string
  name?: string
  networkId: number
  nodeSynced: boolean
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
  mobilePosition?: 'bottom' | 'top'
  desktopPosition?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
  darkMode?: boolean
  txApproveReminderTimeout?: number
  txStallPendingTimeout?: number
  txStallConfirmedTimeout?: number
  notifyMessages?: NotifyMessages
  clientLocale?: string
}

interface Hash {
  (hash: string, id?: string):
    | never
    | { details: TransactionLog; emitter: Emitter }
}

interface Transaction {
  (options: TransactionOptions): { result: Promise<string>; emitter: Emitter }
}

interface Account {
  (address: string): never | { details: { address: string }; emitter: Emitter }
}

interface Unsubscribe {
  (addressOrHash: string): void
}

interface Notification {
  (notificationObject: CustomNotificationObject): {
    dismiss: () => void
    update: UpdateNotification
  }
}

interface Config {
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

export interface TransactionLog {
  hash: string
  id: string
  startTime: number
  status: string
  from?: string
  to?: string
  value?: number | string
  gas?: string
  gasPrice?: string
  nonce?: number
}

export interface EmitterListener {
  (state: TransactionData): boolean | undefined | CustomNotificationObject
}

export interface Emitter {
  listeners: {
    [key: string]: EmitterListener
  }
  on: (eventCode: string, listener: EmitterListener) => void
  emit: (
    state: TransactionData
  ) => boolean | undefined | CustomNotificationObject
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

export interface WritableStore {
  set: (newValue: any) => void
  update: (newValue: any) => void
  subscribe: (callback: (store: any) => any) => () => void
}

export interface TransactionStore {
  subscribe: (callback: (store: any) => any) => void
  updateQueue: (transaction: TransactionData) => void
  add: (transaction: TransactionData) => void
}

export interface NotificationStore {
  subscribe: (callback: (store: any) => any) => void
  add: (notification: NotificationObject) => void
  remove: (id: string, eventCode: string) => void
  update: (updater: (store: any) => any) => void
}
