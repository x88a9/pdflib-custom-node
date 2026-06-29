/**
 * Copies non-TypeScript assets (icons, codex JSON) from src/ to dist/
 * preserving the directory structure, since `tsc` only emits .js/.d.ts files.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DEST = path.join(__dirname, 'dist');
const ASSET_EXTENSIONS = ['.svg', '.png', '.json'];

function copyAssets(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			copyAssets(fullPath);
		} else if (ASSET_EXTENSIONS.includes(path.extname(entry.name))) {
			const relative = path.relative(SRC, fullPath);
			const target = path.join(DEST, relative);
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.copyFileSync(fullPath, target);
			console.log(`copied ${relative}`);
		}
	}
}

copyAssets(SRC);
