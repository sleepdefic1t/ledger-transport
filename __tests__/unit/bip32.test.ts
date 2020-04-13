import "jest-extended";

import { Bip32Path } from "../../src/bip32";
import { Bip32ElementError, Bip32PathError } from "../../src/errors";
import { Fixtures } from "./__fixtures__/transport-fixtures";

describe("Bip32", () => {
    test("should fail to parse an empty path", () => {
        expect(() => {
            Bip32Path.fromString("");
        }).toThrow(Bip32PathError);
    });

    test("should fail to parse a path-string with non-numeric characters", () => {
        expect(() => {
            Bip32Path.fromString(Fixtures.bip32Path.invalid);
        }).toThrow(Bip32ElementError);
    });
});
