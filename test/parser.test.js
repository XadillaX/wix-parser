const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs').promises;
const { parse, WixImageInfo } = require('../lib/index');

const EXAMPLE_FILE = path.join(__dirname, '..', 'example', 'ChrSel.WIX');
const TEMP_DIR = path.join(__dirname, 'temp');

describe('parse', () => {
  it('should parse a valid wix file', async () => {
    const wix = await parse(EXAMPLE_FILE);

    assert.ok(wix instanceof WixImageInfo);
    assert.strictEqual(typeof wix.title, 'string');
    assert.ok(wix.title.length > 0);
    assert.ok(Array.isArray(wix.wilPositions));
    assert.ok(wix.wilPositions.length > 0);
  });

  it('should parse title correctly', async () => {
    const wix = await parse(EXAMPLE_FILE);

    assert.strictEqual(wix.title, '#INDX v1.0-WEMADE Entertainment inc.\b');
  });

  it('should parse wilPositions correctly', async () => {
    const wix = await parse(EXAMPLE_FILE);

    assert.strictEqual(wix.wilPositions.length, 280);
    assert.strictEqual(wix.wilPositions[0], 1080);
    assert.strictEqual(wix.wilPositions[1], 1089);
    assert.strictEqual(wix.wilPositions[2], 1098);
  });

  it('should throw error for non-existent file', async () => {
    await assert.rejects(
      () => parse('/non/existent/file.wix'),
      { code: 'ENOENT' }
    );
  });

  it('should throw error for file too small', async () => {
    const smallFile = path.join(TEMP_DIR, 'small.wix');
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.writeFile(smallFile, Buffer.alloc(10));

    await assert.rejects(
      () => parse(smallFile),
      { message: /file size 10 is less than minimum header size 48/ }
    );

    await fs.unlink(smallFile);
  });

  it('should throw error for invalid index count', async () => {
    const invalidFile = path.join(TEMP_DIR, 'invalid.wix');
    await fs.mkdir(TEMP_DIR, { recursive: true });

    const buffer = Buffer.alloc(48);
    buffer.write('Test Title', 0, 44, 'utf8');
    buffer.writeInt32LE(100, 44);

    await fs.writeFile(invalidFile, buffer);

    await assert.rejects(
      () => parse(invalidFile),
      { message: /expected 400 bytes of position data, but got 0 bytes/ }
    );

    await fs.unlink(invalidFile);
  });
});

describe('WixImageInfo', () => {
  describe('constructor', () => {
    it('should create instance from valid buffer', () => {
      const buffer = Buffer.alloc(52);
      buffer.write('Test Title', 0, 44, 'utf8');
      buffer.writeInt32LE(1, 44);
      buffer.writeInt32LE(12345, 48);

      const wix = new WixImageInfo(buffer);

      assert.strictEqual(wix.title, 'Test Title');
      assert.deepStrictEqual(wix.wilPositions, [ 12345 ]);
    });

    it('should handle empty positions array', () => {
      const buffer = Buffer.alloc(48);
      buffer.write('Empty', 0, 44, 'utf8');
      buffer.writeInt32LE(0, 44);

      const wix = new WixImageInfo(buffer);

      assert.strictEqual(wix.title, 'Empty');
      assert.deepStrictEqual(wix.wilPositions, []);
    });

    it('should throw error for buffer too small', () => {
      const buffer = Buffer.alloc(20);

      assert.throws(
        () => new WixImageInfo(buffer),
        { message: /file size 20 is less than minimum header size 48/ }
      );
    });

    it('should throw error for negative index count', () => {
      const buffer = Buffer.alloc(48);
      buffer.write('Test', 0, 44, 'utf8');
      buffer.writeInt32LE(-1, 44);

      assert.throws(
        () => new WixImageInfo(buffer),
        { message: /index count -1 is negative/ }
      );
    });

    it('should throw error for mismatched data size', () => {
      const buffer = Buffer.alloc(52);
      buffer.write('Test', 0, 44, 'utf8');
      buffer.writeInt32LE(10, 44);

      assert.throws(
        () => new WixImageInfo(buffer),
        { message: /expected 40 bytes of position data, but got 4 bytes/ }
      );
    });
  });

  describe('dump', () => {
    before(async () => {
      await fs.mkdir(TEMP_DIR, { recursive: true });
    });

    after(async () => {
      try {
        await fs.rm(TEMP_DIR, { recursive: true });
      } catch (e) {
        // ignore cleanup errors
      }
    });

    it('should dump and re-parse correctly', async () => {
      const original = await parse(EXAMPLE_FILE);
      const dumpFile = path.join(TEMP_DIR, 'dump.wix');

      await original.dump(dumpFile);

      const reparsed = await parse(dumpFile);

      assert.strictEqual(reparsed.title, original.title);
      assert.deepStrictEqual(reparsed.wilPositions, original.wilPositions);
    });

    it('should dump empty positions array correctly', async () => {
      const buffer = Buffer.alloc(48);
      buffer.write('Empty Test', 0, 44, 'utf8');
      buffer.writeInt32LE(0, 44);

      const wix = new WixImageInfo(buffer);
      const dumpFile = path.join(TEMP_DIR, 'empty.wix');

      await wix.dump(dumpFile);

      const reparsed = await parse(dumpFile);

      assert.strictEqual(reparsed.title, 'Empty Test');
      assert.deepStrictEqual(reparsed.wilPositions, []);
    });

    it('should dump multiple positions correctly', async () => {
      const buffer = Buffer.alloc(60);
      buffer.write('Multi Test', 0, 44, 'utf8');
      buffer.writeInt32LE(3, 44);
      buffer.writeInt32LE(100, 48);
      buffer.writeInt32LE(200, 52);
      buffer.writeInt32LE(300, 56);

      const wix = new WixImageInfo(buffer);
      const dumpFile = path.join(TEMP_DIR, 'multi.wix');

      await wix.dump(dumpFile);

      const reparsed = await parse(dumpFile);

      assert.strictEqual(reparsed.title, 'Multi Test');
      assert.deepStrictEqual(reparsed.wilPositions, [ 100, 200, 300 ]);
    });
  });
});
