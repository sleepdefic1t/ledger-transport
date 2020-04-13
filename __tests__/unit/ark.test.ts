import "jest-extended";

import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";

import { ARKTransport } from "../../src/index";
import { Fixtures } from "./__fixtures__/transport-fixtures";

class TransportMock {
    protected readonly record: RecordStore;

    private constructor(record: RecordStore) {
        this.record = record;
    }

    public static async getARKTransport(record: RecordStore): Promise<ARKTransport> {
        const mock = new TransportMock(record);
        const Transport = createTransportReplayer(mock.record);
        const transport = await Transport.open();
        return new ARKTransport(transport);
    }
}

describe("ARKTransport", () => {
    describe("getVersion", () => {
        it("should pass with an app version", async () => {
            const ark = await TransportMock.getARKTransport(RecordStore.fromString(Fixtures.appVersion.record));
            const appVersion = await ark.getVersion();
            expect(appVersion).toEqual(Fixtures.appVersion.result);
        });
    });

    describe("getPublicKey", () => {
        it("should pass with a compressed publicKey", async () => {
            const ark = await TransportMock.getARKTransport(RecordStore.fromString(Fixtures.publicKey.record));
            const publicKey = await ark.getPublicKey(Fixtures.bip32Path.valid);
            expect(publicKey).toEqual(Fixtures.publicKey.result);
        });
    });

    describe("signTransaction", () => {
        it("should pass with an ecdsa signature", async () => {
            const ark = await TransportMock.getARKTransport(RecordStore.fromString(Fixtures.transaction.ecdsa.record));
            const transaction = Buffer.from(Fixtures.transaction.ecdsa.payload, "hex");
            const signature = await ark.signTransaction(Fixtures.bip32Path.valid, transaction);
            expect(signature).toEqual(Fixtures.transaction.ecdsa.result);
        });

        it("should pass with an ecdsa signature for a large transaction", async () => {
            const ark = await TransportMock.getARKTransport(RecordStore.fromString(Fixtures.transaction.large.record));
            const transaction = Buffer.from(Fixtures.transaction.large.payload, "hex");
            const signature = await ark.signTransaction(Fixtures.bip32Path.valid, transaction);
            expect(signature).toEqual(Fixtures.transaction.large.result);
        });
    });

    describe("signMessage", () => {
        it("should pass with an ecdsa signature", async () => {
            const ark = await TransportMock.getARKTransport(RecordStore.fromString(Fixtures.message.ecdsa.record));
            const message = Buffer.from(Fixtures.message.ecdsa.payload, "hex");
            const signature = await ark.signMessage(Fixtures.bip32Path.valid, message);
            expect(signature).toEqual(Fixtures.message.ecdsa.result);
        });
    });
});
