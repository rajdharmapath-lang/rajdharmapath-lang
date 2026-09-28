import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hskSource = fs.readFileSync(path.join(root, 'src', 'hsk500.ts'), 'utf8');
const sourceMatch = hskSource.match(/const SOURCE = `([\s\S]*?)`/);
if (!sourceMatch) throw new Error('Cannot locate the source character sequence');

const chars = [...new Set([...sourceMatch[1]].filter(char => /\p{Script=Han}/u.test(char)))].slice(0, 500);
if (chars.length !== 500) throw new Error(`Expected 500 unique characters, found ${chars.length}`);

const dataDir = path.join(root, 'data');
const files = fs.readdirSync(dataDir).filter(name => name.endsWith('.json'));
if (files.length !== 500) throw new Error(`Expected 500 JSON files, found ${files.length}`);

for (const char of chars) {
  const file = path.join(dataDir, `${char}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing data for ${char}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.strokes) || !data.strokes.length) throw new Error(`No strokes for ${char}`);
  if (!Array.isArray(data.medians) || data.medians.length !== data.strokes.length) throw new Error(`Invalid medians for ${char}`);
}

const component = fs.readFileSync(path.join(root, 'src', 'ChineseStrokeWriter.tsx'), 'utf8');
if (/https?:\/\//.test(component)) throw new Error('Remote URL found in component');
if (!component.includes('OFFLINE_CHARACTER_DATA')) throw new Error('Offline data map is not connected');
if (!component.includes('HANZI_WRITER_SOURCE')) throw new Error('Offline writer engine is not connected');

console.log('PASS: exactly 500 unique characters, 500 valid local stroke-data files, and zero remote runtime URLs.');
