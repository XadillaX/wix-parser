# Wix Parser

Parser for *.wix (Legacy version of "Legend of Mir2") files.

## Installation

```shell
npm install wix-parser
```

## Usage

### CommonJS

```js
const path = require('path');
const { parse } = require('wix-parser');

(async () => {
  const wix = await parse(path.join(process.cwd(), 'ChrSel.WIX'));
  console.log(wix.title);
  console.log(wix.wilPositions);

  await wix.dump('output.wix');
})();
```

### TypeScript / ESM

```ts
import path from 'path';
import { parse, WixImageInfo } from 'wix-parser';

const wix: WixImageInfo = await parse(path.join(process.cwd(), 'ChrSel.WIX'));
console.log(wix.title);
console.log(wix.wilPositions);

await wix.dump('output.wix');
```

## API

### `parse(filename: string): Promise<WixImageInfo>`

Parses a `.wix` file and returns a `WixImageInfo` instance.

**Parameters:**
- `filename` - Path to the `.wix` file

**Returns:** A `Promise` that resolves to a `WixImageInfo` instance

**Throws:**
- `Error` if the file does not exist
- `Error` if the file format is invalid

### `class WixImageInfo`

Represents the parsed content of a `.wix` file.

**Properties:**
- `title: string` - The title stored in the file header
- `wilPositions: number[]` - Array of position offsets for images in the corresponding `.wil` file

**Methods:**
- `dump(filename: string): Promise<void>` - Writes the data back to a `.wix` file

## File Format

The `.wix` file format consists of:
- 44 bytes: Title (null-terminated string)
- 4 bytes: Index count (int32 LE)
- N × 4 bytes: Position array (int32 LE each)

## Contribution

PRs and issues are welcomed.

## License

MIT
