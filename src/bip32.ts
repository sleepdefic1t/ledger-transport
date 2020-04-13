import { Bip32ElementError, Bip32PathError } from "./errors";

/**
 * Handle the Parsing of Bip32 Paths
 *
 * https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 *
 * @example const bip32Bytes = Bip32Path.fromString("44'/111'/0'/0/0").toBytes()
 */
export class Bip32Path {
    private static readonly HARDENED: number = 0x80000000;
    protected _elements: number[] = [];

    /**
     * Private constructor.
     * Ensures precondition that 'fromString' is called before 'toBytes'.
     *
     * @param {number[]} elements a bip32 path as an array of elements
     */
    private constructor(elements: number[]) {
        this._elements = elements;
    }

    /**
     * Parses a Bip32 path-string, storing the path as elements,
     * and returns a Bip32Path instance.
     *
     * Elements are stored as a 4-byte/uint32 Big-Endian-packed number array.
     *
     * @param {string} path a bip32 path as a string
     * @throws {Error} if the path-string is null
     * @throws {Error} if the path-string has a length of '0'
     * @returns {Bip32Path} a new instance containing parsed path elements
     */
    public static fromString(path: string): Bip32Path {
        if (!path || path.length === 0) {
            throw new Bip32PathError();
        }

        return this.pathToElements(path);
    }

    /**
     * Parses and stores a Bip32 Path-string as an array of elements to the 'Bip32Path' instance.
     *
     * @param {string} path a bip32 path as a string
     * @throws {Error} if the path-string is null
     * @throws {Error} if the path-string has a length of '0'
     * @throws {Error} if the path-string has non-numeric characters
     * @returns {Bip32Path} a new instance containing parsed path elements
     */
    protected static pathToElements(path: string): Bip32Path {
        const _elements: number[] = [];
        for (const level of path.split("/")) {
            let element = parseInt(level, 10);
            if (isNaN(element)) {
                throw new Bip32ElementError();
            }

            if (level.length > 1 && level.endsWith("'")) {
                // Use hardening
                element += Bip32Path.HARDENED;
            }

            _elements.push(element);
        }

        return new Bip32Path(_elements);
    }

    /**
     * Get the bytes of a Parsed Bip32 Element Array.
     *
     * @returns {Buffer} a buffer of bytes representing the path
     * @throws {Error} if the internal bip32 element array has a length of '0'
     * @returns {Buffer} a byte buffer of parsed bip32 path elements
     */
    public toBytes(): Buffer {
        const payload = Buffer.alloc(1 + this._elements.length * 4);
        payload[0] = this._elements.length;

        let index = 0;
        for (const element of this._elements) {
            payload.writeUInt32BE(element, 1 + index * 4);
            index += 1;
        }

        return payload;
    }
}
