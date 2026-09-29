// 从原型 index.html 中抽取数据结构，生成小程序 utils/data.js
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, 'index.html');
const OUT = path.join(__dirname, 'wxapp', 'utils', 'data.js');

const html = fs.readFileSync(SRC, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) throw new Error('no script');
const js = m[1];

// 括号配平提取 `const NAME = <value>;`
function extract(name) {
  const idx = js.indexOf('const ' + name + '=');
  if (idx < 0) throw new Error('not found: ' + name);
  let i = js.indexOf('=', idx) + 1;
  // 跳过空白
  while (/\s/.test(js[i])) i++;
  const open = js[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) throw new Error('unsupported value for ' + name);
  let depth = 0, j = i;
  let inStr = null;
  for (; j < js.length; j++) {
    const c = js[j];
    if (inStr) { if (c === '\\') { j++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) break; }
  }
  return js.slice(i, j + 1);
}

const names = ['CITIES', 'SCENES', 'GRADS', 'ACTS', 'I18N', 'SUB_KW', 'SCENE_KW'];
const parts = names.map(n => 'const ' + n + ' = ' + extract(n) + ';');
// 校验：能被求值
new Function(parts.join('\n') + '\nreturn {CITIES,SCENES,GRADS,ACTS,I18N};')();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, parts.join('\n\n') + '\n\nmodule.exports = { CITIES, SCENES, GRADS, ACTS, I18N, SUB_KW, SCENE_KW };\n');
console.log('data.js written:', OUT);
console.log('CITIES:', eval(extract('CITIES')).length, '| SCENES:', eval(extract('SCENES')).length, '| ACTS:', eval(extract('ACTS')).length);
