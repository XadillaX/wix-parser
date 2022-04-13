'use strict';

const fs = require('fs').promises;
const { createWriteStream } = require('fs');

async function streamWrite(stream, chunk) {
  return new Promise((resolve, reject) => {
    stream.write(chunk, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

class WixImageInfo {
  constructor(buff) {
    const firstZeroPos = buff.indexOf(0);
    this.title = buff.toString('utf8', 0, firstZeroPos);
    const indexCount = buff.readInt32LE(44);
    this.wilPositions = [];
    const left = buff.length - 48;
    if (left !== indexCount * 4) {
      throw new Error('Invalid index count');
    }

    const totalSize = buff.length;
    for (let i = 48; i < totalSize; i += 4) {
      this.wilPositions.push(buff.readInt32LE(i));
    }
  }

  async dump(filename) {
    const stream = createWriteStream(filename, 'binary');

    const titleBuff = Buffer.alloc(44);
    titleBuff.write(this.title, 0, 44, 'utf8');
    stream.write(titleBuff);

    const intBuff = Buffer.alloc(4);

    intBuff.writeInt32LE(this.wilPositions.length, 0);
    await streamWrite(stream, intBuff);

    for (let i = 0; i < this.indexCount; i++) {
      intBuff.writeInt32LE(this.wilPositions[i], 0);
      await streamWrite(stream, intBuff);
    }

    let resolve;
    const promise = new Promise(res => {
      resolve = res;
    });

    stream.end(() => {
      resolve();
    });
    await promise;

    stream.close();
  }
}

async function parse(filename) {
  const data = await fs.readFile(filename);
  if (data.length < 24) {
    throw new Error('Invalid file');
  }

  const wixImageInfo = new WixImageInfo(data);
  return wixImageInfo;
}

module.exports = {
  parse,
  WixImageInfo,
};
