"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const fs_1 = require("fs");
const wix_image_info_1 = require("./wix-image-info");
async function parse(filename) {
    const data = await fs_1.promises.readFile(filename);
    return new wix_image_info_1.WixImageInfo(data);
}
//# sourceMappingURL=parser.js.map