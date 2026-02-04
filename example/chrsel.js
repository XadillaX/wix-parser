'use strict';

const path = require('path');

const { parse } = require('../lib/index');

(async () => {
  const filename = process.argv[2] || path.join(__dirname, 'ChrSel.WIX');
  const wix = await parse(filename);
  console.log(wix);
  await wix.dump(filename + '.bak');
})();
