import { createWriteStream, WriteStream } from 'fs';

const TITLE_SIZE = 44;
const INDEX_COUNT_SIZE = 4;
const HEADER_SIZE = TITLE_SIZE + INDEX_COUNT_SIZE;
const POSITION_SIZE = 4;

function streamWrite(stream: WriteStream, chunk: Buffer): Promise<void> {
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

function streamEnd(stream: WriteStream): Promise<void> {
  return new Promise(resolve => {
    stream.end(() => {
      resolve();
    });
  });
}

export class WixImageInfo {
  public title: string;
  public wilPositions: number[];

  constructor(buffer: Buffer) {
    if (buffer.length < HEADER_SIZE) {
      throw new Error(
        `Invalid file: file size ${buffer.length} is less than ` +
        `minimum header size ${HEADER_SIZE}`,
      );
    }

    const firstZeroPos = buffer.indexOf(0);
    this.title = buffer.toString(
      'utf8',
      0,
      firstZeroPos === -1 ? TITLE_SIZE : Math.min(firstZeroPos, TITLE_SIZE),
    );

    const indexCount = buffer.readInt32LE(TITLE_SIZE);
    if (indexCount < 0) {
      throw new Error(`Invalid file: index count ${indexCount} is negative`);
    }

    const dataSize = buffer.length - HEADER_SIZE;
    const expectedDataSize = indexCount * POSITION_SIZE;
    if (dataSize !== expectedDataSize) {
      throw new Error(
        `Invalid file: expected ${expectedDataSize} bytes of position data, ` +
        `but got ${dataSize} bytes`,
      );
    }

    this.wilPositions = [];
    for (let i = HEADER_SIZE; i < buffer.length; i += POSITION_SIZE) {
      this.wilPositions.push(buffer.readInt32LE(i));
    }
  }

  async dump(filename: string): Promise<void> {
    const stream = createWriteStream(filename, { encoding: 'binary' });

    const titleBuffer = Buffer.alloc(TITLE_SIZE);
    titleBuffer.write(this.title, 0, TITLE_SIZE, 'utf8');
    await streamWrite(stream, titleBuffer);

    const intBuffer = Buffer.alloc(INDEX_COUNT_SIZE);
    intBuffer.writeInt32LE(this.wilPositions.length, 0);
    await streamWrite(stream, intBuffer);

    for (const position of this.wilPositions) {
      intBuffer.writeInt32LE(position, 0);
      await streamWrite(stream, intBuffer);
    }

    await streamEnd(stream);
    stream.close();
  }
}
