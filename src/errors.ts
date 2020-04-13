export class LedgerTransportError extends Error {
    public constructor(message: string) {
        super(message);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message,
        });

        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ApduPayloadLengthError extends LedgerTransportError {
    public constructor(expected: number, limit: number) {
        super(`Payload length of ${expected} exceeds ${limit}.`);
    }
}

export class Bip32ElementError extends LedgerTransportError {
    public constructor() {
        super(`Invalid Bip32 Element.`);
    }
}

export class Bip32PathError extends LedgerTransportError {
    public constructor() {
        super(`Invalid Bip32 Path.`);
    }
}
