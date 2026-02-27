const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/app/{admin,employee}/**/*.tsx', { cwd: __dirname });

files.forEach(file => {
  const absolutePath = path.join(__dirname, file);
  let content = fs.readFileSync(absolutePath, 'utf8');
  if (content.includes('<div className=\"overflow-x-auto\">')) {
    content = content.replace(/<div className=\"overflow-x-auto\">/g, '<div className=\"overflow-x-auto pb-32 min-h-[300px]\">');
    fs.writeFileSync(absolutePath, content);
    console.log('Fixed:', file);
  }
});
