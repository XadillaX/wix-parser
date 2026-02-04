import { promises as fs } from 'fs';
import { WixImageInfo } from './wix-image-info';

export async function parse(filename: string): Promise<WixImageInfo> {
  const data: Buffer = await fs.readFile(filename);
  return new WixImageInfo(data);
}
