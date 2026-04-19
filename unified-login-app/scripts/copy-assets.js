/**
 * 跨平台资源复制脚本
 * 将根目录的 Web 资源复制到 www/ 目录（兼容 Windows 和 Mac/Linux）
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const WWW = ROOT + '/www';

// 要复制的单个文件
const FILES = ['index.html', 'manifest.json', 'sw.js'];
// 要复制的文件夹
const DIRS = ['css', 'js', 'assets'];

function copyFile(src, dest) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

// 确保www目录存在
if (!fs.existsSync(WWW)) fs.mkdirSync(WWW, { recursive: true });

// 复制文件
for (const file of FILES) {
    const src = path.join(ROOT, file);
    const dest = path.join(WWW, file);
    if (fs.existsSync(src)) {
        copyFile(src, dest);
        console.log('  ✓ ' + file);
    } else {
        console.log('  ✗ ' + file + ' (not found)');
    }
}

// 复制文件夹
for (const dir of DIRS) {
    const src = path.join(ROOT, dir);
    const dest = path.join(WWW, dir);
    if (fs.existsSync(src)) {
        copyDir(src, dest);
        console.log('  ✓ ' + dir + '/');
    } else {
        console.log('  ✗ ' + dir + '/ (not found)');
    }
}

console.log('\n资源复制完成！');
