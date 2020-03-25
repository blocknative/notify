import BlocknativeSdk from 'bnc-sdk'

import { TransactionHandler } from './interfaces'

let blocknative: any

export function getBlocknative(options?: {
  dappId: string
  networkId: number
  transactionHandlers: TransactionHandler[]
  name: string
}): any {
  if (!blocknative && options) {
    blocknative = new BlocknativeSdk(options)
  }

  return blocknative
}
