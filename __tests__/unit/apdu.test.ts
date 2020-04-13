import "jest-extended";

import { Apdu } from "../../src/apdu";
import { ApduPayloadLengthError } from "../../src/errors";

describe("Apdu", () => {
    test("should fail with a payload that's too big", () => {
        expect(() => {
            const exceedingSize = 3000;
            new Apdu(0, 0, 0, 0, Buffer.alloc(exceedingSize));
        }).toThrow(ApduPayloadLengthError);
    });
});
