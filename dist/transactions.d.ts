import { TransactionData, PreflightEvent, ContractObject, CustomNotificationObject, Emitter, TransactionOptions } from "./interfaces";
export declare function handlePreFlightEvent(preflightEvent: PreflightEvent): void;
export declare function handleTransactionEvent(event: {
    transaction: TransactionData;
    emitterResult: boolean | undefined | CustomNotificationObject;
}): void;
export declare function duplicateTransactionCandidate(transaction: TransactionData, contract: ContractObject): false | TransactionData | undefined;
export declare function preflightTransaction(options: TransactionOptions, emitter: Emitter): Promise<string>;
