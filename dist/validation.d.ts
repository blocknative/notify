import { InitOptions, TransactionOptions, CustomNotificationObject, ConfigOptions } from "./interfaces";
export declare function validateType({ name, value, type, optional, customValidation }: {
    name: string;
    value: any;
    type: string;
    optional?: boolean;
    customValidation?: (val: any) => boolean;
}): never | void;
export declare function validateInit(init: InitOptions): void;
export declare function validateTransactionOptions(options: TransactionOptions): void;
export declare function validateNotificationObject(notification: CustomNotificationObject | boolean | undefined): void;
export declare function validateConfig(config: ConfigOptions): void;
