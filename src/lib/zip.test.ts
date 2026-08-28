import { describe, expect, it } from "vitest";
import { createZip } from "./zip";

const u8 = (s: string) => new TextEncoder().encode(s);

describe("createZip", () => {
  it("produces a valid zip container for multiple entries", async () => {
    const blob = createZip([
      { name: "a.txt", data: u8("hello") },
      { name: "b.txt", data: u8("world!!") },
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const dv = new DataView(bytes.buffer);

    // First local file header signature.
    expect(dv.getUint32(0, true)).toBe(0x04034b50);

    // End-of-central-directory signature sits in the final 22 bytes.
    const eocdOffset = bytes.length - 22;
    expect(dv.getUint32(eocdOffset, true)).toBe(0x06054b50);
    // Entry count (total records) in the EOCD.
    expect(dv.getUint16(eocdOffset + 10, true)).toBe(2);
  });

  it("stores payload bytes verbatim (STORE method)", async () => {
    const payload = u8("verbatim-payload");
    const blob = createZip([{ name: "f.bin", data: payload }]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // Local header is 30 bytes + name length (5) → data starts at 35.
    const start = 35;
    const stored = bytes.slice(start, start + payload.length);
    expect([...stored]).toEqual([...payload]);
  });

  it("handles an empty entry list", async () => {
    const blob = createZip([]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes.length).toBe(22); // EOCD only
    const dv = new DataView(bytes.buffer);
    expect(dv.getUint32(0, true)).toBe(0x06054b50);
  });
});
