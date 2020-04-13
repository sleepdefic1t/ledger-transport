import { Transport as LedgerTransport } from "@ledgerhq/hw-transport";

import { Apdu, ApduFlags } from "./apdu";
import { Bip32Path } from "./bip32";
import { Transport } from "./contracts";

/**
 * ARK Ledger Transport Class.
 *
 * Send APDU Payloads to a Ledger Device.
 *
 * - INS_GET_PUBLIC_KEY
 * - INS_GET_VERSION
 * - INS_SIGN_TRANSACTION
 * - INS_SIGN_MESSAGE
 */
export class ARK implements Transport {
    private transport: LedgerTransport;

    /**
     * Create an instance using a 'LedgerTransport' object.
     *
     * 'decorateAppAPIMethods' basically "locks" execution of the current instruction,
     * preventing race conditions where parallel calls are attempted.
     *
     * @param {LedgerTransport} transport generic transport interface for Ledger HW.
     * @throws {Error} if 'LedgerTransport' is busy with another instruction.
     */
    public constructor(transport: LedgerTransport) {
        this.transport = transport;
        this.transport.decorateAppAPIMethods(
            this,
            ["getVersion", "getPublicKey", "signMessage", "signTransaction"],
            "w0w",
        );
    }

    /**
     * Get the installed Application version from a Ledger Device.
     *
     * @returns {Promise<string>} installed application version (e.g. '2.0.1')
     */
    public async getVersion(): Promise<string> {
        const response = await new Apdu(
            ApduFlags.CLA,
            ApduFlags.INS_GET_VERSION,
            ApduFlags.P1_NON_CONFIRM,
            ApduFlags.P2_NO_CHAINCODE,
        ).send(this.transport);

        return `${response[1]}.${response[2]}.${response[3]}`;
    }

    /**
     * Get the PublicKey from a Ledger Device using a Bip32 path-string.
     *
     * @param {string} path bip32 path as a string
     * @returns {Promise<string>} device compressed publicKey
     */
    public async getPublicKey(path: string): Promise<string> {
        const response = await new Apdu(
            ApduFlags.CLA,
            ApduFlags.INS_GET_PUBLIC_KEY,
            ApduFlags.P1_NON_CONFIRM,
            ApduFlags.P2_NO_CHAINCODE,
            Bip32Path.fromString(path).toBytes(),
        ).send(this.transport);

        return response.slice(1, 1 + response[0]).toString("hex");
    }

    /**
     * Sign a Message using a Ledger Device.
     *
     * @param {string} path bip32 path as a string
     * @param {Buffer} hex transaction payload hex
     * @returns {Promise<string>} payload signature
     */
    public async signMessage(path: string, hex: Buffer): Promise<string> {
        return this.sign(ApduFlags.INS_SIGN_MESSAGE, path, hex);
    }

    /**
     * Sign a Transaction using a Ledger Device.
     *
     * @param {string} path bip32 path as a string
     * @param {Buffer} hex transaction payload hex
     * @returns {Promise<string>} payload signature
     */
    public async signTransaction(path: string, hex: Buffer): Promise<string> {
        return this.sign(ApduFlags.INS_SIGN_TRANSACTION, path, hex);
    }

    /**
     * Sign using a Ledger Device.
     *
     * @param {number} ins type of operation (e.g. Transaction, Message, etc.)
     * @param {string} path Bip32 Path string
     * @param {Buffer} hex transaction payload hex
     * @returns {Promise<string>} payload signature
     */
    private async sign(ins: number, path: string, hex: Buffer): Promise<string> {
        const response = await new Apdu(
            ApduFlags.CLA,
            ins,
            ApduFlags.P1_SINGLE,
            ApduFlags.P2_ECDSA,
            Buffer.concat([Bip32Path.fromString(path).toBytes(), hex]),
        ).send(this.transport);

        return response.toString("hex");
    }
}
