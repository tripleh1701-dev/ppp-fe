const fs = require('fs');
const path = require('path');

const files = [
    'TechnicalUserModal.tsx',
    'ContactModal.tsx',
    'AddressModal.tsx',
    'AddressModal_working.tsx'
];

const baseDir = './src/components';

files.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if not exists
    if (!content.includes("import { generateId }")) {
        content = content.replace(
            /^(import.*?;\n)/m,
            `$1import { generateId } from '@/utils/id-generator';\n`
        );
    }
    
    // Replace crypto.randomUUID with generateId
    content = content.replace(/crypto\.randomUUID\(\)/g, 'generateId()');
    
    fs.writeFileSync(filePath, content);
});