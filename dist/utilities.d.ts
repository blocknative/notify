import { Emitter } from "./interfaces";
export declare function argsEqual(args1: any, args2: any): boolean;
export declare function timeString(time: number): string;
export declare function formatTime(number: number): string;
export declare function replaceOrAdd(list: any[], predicate: (val: any) => boolean, data: any): any[];
export declare function extractMessageFromError(error: {
    message: string;
    stack: string;
}): {
    eventCode: string;
    errorMsg: string;
};
export declare function createEmitter(): Emitter;
