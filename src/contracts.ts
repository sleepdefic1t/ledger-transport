export interface Transport {
    getVersion(): Promise<string>;
    getPublicKey(path: string): Promise<string>;
    signTransaction(path: string, hex: Buffer): Promise<string>;
    signMessage(path: string, hex: Buffer): Promise<string>;
}
