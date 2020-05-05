import BlocknativeSdk from 'bnc-sdk'

import { TransactionHandler, System } from './interfaces'

let blocknative: any

export function getBlocknative(options?: {
  dappId: string
  networkId: number
  transactionHandlers: TransactionHandler[]
  name: string
  apiUrl?: string
  system?: System
}): any {
  if (!blocknative && options) {
    blocknative = new BlocknativeSdk(options)
  }

  return blocknative
}
