import "jest-extended";

import { Apdu } from "../../src/apdu";
import { ApduPayloadChunkError, ApduPayloadLengthError } from "../../src/errors";

class ApduMock extends Apdu {
    public constructor() {
        super(0, 0, 0, 0);
    }
    public PayLoadToChunks(): Buffer[] {
        return this.getPayloadChunks();
    }
}

describe("Apdu", () => {
    test("should fail with a payload that's too big", () => {
        expect(() => {
            const exceedingSize = 3000;
            new Apdu(0, 0, 0, 0, Buffer.alloc(exceedingSize));
        }).toThrow(ApduPayloadLengthError);
    });

    describe("PayLoadToChunks", () => {
        test("should fail with an empty or unmatchable payload", () => {
            expect(() => {
                new ApduMock().PayLoadToChunks();
            }).toThrow(ApduPayloadChunkError);
        });
    });
});
