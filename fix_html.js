const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.html')) results.push(file);
        }
    });
    return results;
}
const files = walk(path.join(__dirname, 'frontend/pages'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Clean up <head> explicitly
    content = content.replace(/<link rel="stylesheet".*?>/g, '<link rel="stylesheet" href="../css/style.css">');
    // Remove scripts from head
    content = content.replace(/<\/head>/, `    <script type="module" src="/js/main.js"></script>\n</head>`);
    content = content.replace(/<script src="\.\.\/js\/(components\/.+|auth)\.js"><\/script>\n?/g, '');
    
    // Remove router.js
    content = content.replace(/<script src="\.\.\/js\/router\.js"><\/script>\n?/g, '');

    fs.writeFileSync(file, content);
});
console.log("Done fixing html files");
