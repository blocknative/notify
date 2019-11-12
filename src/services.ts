import blocknativeSdk from 'bnc-sdk'

import { TransactionHandler } from './interfaces'

let blocknative: any

export function getBlocknative(options?: {
  dappId: string
  networkId: number
  transactionHandlers: TransactionHandler[]
}): any {
  if (!blocknative && options) {
    blocknative = blocknativeSdk(options)
  }

  return blocknative
}
