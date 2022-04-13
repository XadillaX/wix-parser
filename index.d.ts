export class WixImageInfo {
  public title: string;
  public wilPositions: number[];

  constructor(buff: Buffer);
  dump(filename: string): Promise<void>;
}

export function parse(filename: string): Promise<WixImageInfo>;
