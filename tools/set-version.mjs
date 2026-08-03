// Stamps a release tag into the footer version span of an index.html copy
//
//   node tools/set-version.mjs _site/index.html vX.X.X

import {readFileSync, writeFileSync} from 'node:fs';

const [file, version] = process.argv.slice(2);
if (!file || !version) {
    console.error('Usage: node tools/set-version.mjs <index.html> <version>');
    process.exit(1);
}

const SPAN = /(<span class="ver">)[^<]*(<\/span>)/;
const src = readFileSync(file, 'utf8');

if (!SPAN.test(src)) {
    console.error(`No <span class="ver"> found in ${file}`);
    process.exit(1);
}

writeFileSync(file, src.replace(SPAN, `$1${version}$2`));
console.log(`Set version to ${version} in ${file}`);
