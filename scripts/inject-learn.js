// Nhúng data/P_learn_grammar.json vào English-Lab.html (khối @@LEARN-DATA-START/END@@).
// Chạy: node scripts/inject-learn.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'English-Lab.html');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'P_learn_grammar.json'), 'utf8'));
delete data._format;

const json = JSON.stringify(data).replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const block = '/* @@LEARN-DATA-START@@ — bài học có hướng dẫn (data/P_learn_grammar.json, nhúng bởi scripts/inject-learn.js) */\n'
  + 'DATA.learn=' + json + ';\n'
  + '/* @@LEARN-DATA-END@@ */';

let html = fs.readFileSync(htmlPath, 'utf8');
const re = /\/\* @@LEARN-DATA-START@@[\s\S]*?@@LEARN-DATA-END@@ \*\//;
if (re.test(html)) {
  html = html.replace(re, () => block);
} else {
  const anchor = '/* @@V2-DATA-END@@ */';
  if (html.split(anchor).length !== 2) throw new Error('Không tìm thấy điểm chèn ' + anchor);
  html = html.replace(anchor, () => anchor + '\n' + block);
}
fs.writeFileSync(htmlPath, html);
console.log('Đã nhúng ' + data.lessons.length + ' bài vào English-Lab.html');
