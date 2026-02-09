const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/map.json', 'utf8'));
const ids = new Map(data.blockTypes.map(b => [b.name, b.id]));
const targetIds = [127,128,129,130,131,132];
const results = new Map();
for (const id of targetIds) results.set(id, []);
for (const [key, value] of Object.entries(data.blocks)) {
  const [xStr,yStr,zStr] = key.split(',');
  const x = Number(xStr);
  const y = Number(yStr);
  const z = Number(zStr);
  if (x < -1110 || x > -1070 || z < -10 || z > 50 || y < 0 || y > 5) continue;
  let blockId = value;
  if (typeof value === 'object' && value && 'i' in value) blockId = value.i;
  if (targetIds.includes(blockId)) {
    results.get(blockId).push({ x, y, z });
  }
}
for (const [id, coords] of results.entries()) {
  if (coords.length === 0) continue;
  const name = [...ids.entries()].find(([,v]) => v === id)?.[0] || id;
  console.log(name, id, 'count', coords.length, 'sample', coords.slice(0,5));
}
