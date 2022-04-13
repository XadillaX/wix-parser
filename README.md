# Wix Parser

Parser for *.wix (Legacy version of "Legend of Mir2") files.

## Installation

```shell
$ npm install --save wix-parser
```

## Usage

```js
const path = require('path');

const { parse } = require('wix-parser');

const wix = await parse(path.join(process.cwd(), 'ChrSel.WIX'));
console.log(wix);
```

## Contribution

PRs and issues are welcomed.
