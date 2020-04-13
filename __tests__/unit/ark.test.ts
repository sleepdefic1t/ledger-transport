import "jest-extended";

import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";

import { ARKTransport } from "../../src/index";
import { Fixtures } from "./__fixtures__/transport-fixtures";

describe("ARKTransport", () => {
    describe("getVersion", () => {
        it("should pass with an app version", async () => {
            const Transport = createTransportReplayer(RecordStore.fromString(Fixtures.appVersion.record));
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const appVersion = await ark.getVersion();
            expect(appVersion).toEqual(Fixtures.appVersion.result);
        });
    });

    describe("getPublicKey", () => {
        it("should pass with a compressed publicKey", async () => {
            const Transport = createTransportReplayer(RecordStore.fromString(Fixtures.publicKey.record));
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const publicKey = await ark.getPublicKey(Fixtures.bip32Path.valid);
            expect(publicKey).toEqual(Fixtures.publicKey.result);
        });
    });

    describe("signTransaction", () => {
        it("should pass with an ecdsa signature", async () => {
            const Transport = createTransportReplayer(RecordStore.fromString(Fixtures.transaction.ecdsa.record));
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const transaction = Buffer.from(Fixtures.transaction.ecdsa.payload, "hex");
            const signature = await ark.signTransaction(Fixtures.bip32Path.valid, transaction);
            expect(signature).toEqual(Fixtures.transaction.ecdsa.result);
        });

        it("should pass with an ecdsa signature for a large transaction", async () => {
            const Transport = createTransportReplayer(RecordStore.fromString(Fixtures.transaction.large.record));
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const transaction = Buffer.from(Fixtures.transaction.large.payload, "hex");
            const signature = await ark.signTransaction(Fixtures.bip32Path.valid, transaction);
            expect(signature).toEqual(Fixtures.transaction.large.result);
        });

        it("should fail with an invalid bip32 path", async () => {
            const Transport = createTransportReplayer();
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const badTransaction = Buffer.from("", "hex");
            async function signBadTransactions() {
                await ark.signTransaction(Fixtures.bip32Path.valid, badTransaction);
            }
            await expect(signBadTransactions()).rejects.toThrow();
        });
    });

    describe("signMessage", () => {
        it("should pass with an ecdsa signature", async () => {
            const Transport = createTransportReplayer(RecordStore.fromString(Fixtures.message.ecdsa.record));
            const transport = await Transport.open();
            const ark = new ARKTransport(transport);
            const message = Buffer.from(Fixtures.message.ecdsa.payload, "hex");
            const signature = await ark.signMessage(Fixtures.bip32Path.valid, message);
            expect(signature).toEqual(Fixtures.message.ecdsa.result);
        });
    });
});
