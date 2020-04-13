import { Transport as LedgerTransport } from "@ledgerhq/hw-transport";

import { ApduPayloadLengthError } from "./errors";

/**
 * APDU Header Flags
 *
 * Describes the APDU Class, Instruction-Type, Parameter 1, and Parameter 2.
 *
 * APDU Header:  ({ CLA + INS + P1 + P2 })
 * - CLA:  Apdu Class
 * - INS:  Instruction Type
 * - P1:   Instruction Parameter 1
 * - P2:   Instruction Parameter 2
 *
 * Instruction Types:
 * - INS_GET_PUBLIC_KEY:    Get a PublicKey from a Ledger Device
 * - INS_GET_VERSION:       Get the ARK Application Version from a Ledger Device
 * - INS_SIGN_TRANSACTION:  Sign a Transaction using a Ledger Device
 * - INS_SIGN_MESSAGE:      Sign a Message using a Ledger Device
 *
 * App / PublicKey Context:
 * P1: User Approval
 * - P1_NON_CONFIRM:  Do NOT request user approval
 * - P1_CONFIRM:      Request user approval
 *
 * P2: ChainCode
 * - P2_NO_CHAINCODE:  Don't use a ChainCode
 * - P2_CHAINCODE:     Use a Chaincode
 *
 * Signing Context:
 * P1: Payload Segment
 * - P1_SINGLE:  N(1) where N === 1
 * - P1_FIRST:   N(1) where N > 1
 * - P1_MORE:    N(2)..N-1 where N > 2
 * - P1_LAST:    Nth where N > 1
 *
 * P2:
 * - P2_ECDSA: Use Ecdsa Signatures
 *
 */
export enum ApduFlags {
    /** APDU Class */
    CLA = 0xe0,

    /** App / PublicKey Context */
    INS_GET_PUBLIC_KEY = 0x02,
    INS_GET_VERSION = 0x06,

    P1_NON_CONFIRM = 0x00,
    P1_CONFIRM = 0x01,

    P2_NO_CHAINCODE = 0x00,
    P2_CHAINCODE = 0x01,

    /** Signing Context */
    INS_SIGN_TRANSACTION = 0x04,
    INS_SIGN_MESSAGE = 0x08,

    P1_SINGLE = 0x80,
    P1_FIRST = 0x00,
    P1_MORE = 0x01,
    P1_LAST = 0x81,

    P2_ECDSA = 0x40,
}

export class Apdu {
    public readonly cla: number;
    public readonly ins: number;
    public readonly p1: number;
    public readonly p2: number;
    private readonly _payload: Buffer;

    private readonly CHUNK_MAX: number = 10;
    private readonly CHUNK_SIZE: number = 255;
    private readonly PAYLOAD_MAX: number = this.CHUNK_MAX * this.CHUNK_SIZE;

    /**
     * Construct an instance of a Bip32 Path Builder, given a string-path.
     *
     * @param {Buffer} path a bip32 hd path, ("44'/111'/0'/0/0")
     */
    public constructor(cla: number, ins: number, p1: number, p2: number, payload: Buffer = Buffer.alloc(0)) {
        this.cla = cla;
        this.ins = ins;
        this.p1 = p1;
        this.p2 = p2;
        if (payload.length < this.PAYLOAD_MAX) {
            this._payload = payload;
        } else {
            throw new ApduPayloadLengthError(payload.length, this.PAYLOAD_MAX);
        }
    }

    public async send(transport: LedgerTransport): Promise<Buffer> {
        let promises: Buffer[] = [];

        if (this._payload.length < this.CHUNK_SIZE) {
            promises.push(await transport.send(this.cla, this.ins, this.p1, this.p2, this._payload));
        } else {
            promises = await this.sendChunked(transport);
        }

        return Buffer.concat(promises.map((r) => r.slice(0, r.length - 2)));
    }

    private getChunks(payload: Buffer): Buffer[] {
        return payload
            .toString("hex")
            .match(new RegExp(`.{1,${this.CHUNK_SIZE * 2}}`, "g"))! /** '!', this should never fail  */
            .map((chunk) => Buffer.from(chunk, "hex"));
    }

    private getSegmentFlag(chunk: Buffer, size: number, index: number): ApduFlags {
        /** set the payload segment flag */
        if (index > 0 && index < size - 1) {
            /** N(2)..N-1 where N > 2 */
            return ApduFlags.P1_MORE;
        } else if (index === size - 1 && size > 1) {
            /** Nth where N > 1 */
            return ApduFlags.P1_LAST;
        } else {
            return ApduFlags.P1_FIRST;
        }
    }

    private async sendChunked(transport: LedgerTransport): Promise<Buffer[]> {
        const chunks = this.getChunks(this._payload);
        const promises: Buffer[] = [];

        let index = 0;
        for (const chunk of chunks) {
            /** send the Apdu chunk */
            promises.push(
                await transport.send(
                    this.cla,
                    this.ins,
                    this.getSegmentFlag(chunk, chunks.length, index),
                    this.p2,
                    chunk,
                ),
            );
            index += 1;
        }

        return promises;
    }
}
