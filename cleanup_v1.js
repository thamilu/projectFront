
const fs = require('fs');
const path = require('path');

const oldPath = 'g:\\Project\\eshop_front\\app\\api\\v1';
const newPath = 'g:\\Project\\eshop_front\\app\\api\\_v1';

try {
  if (fs.existsSync(oldPath)) {
    console.log(`Renaming ${oldPath} to ${newPath}...`);
    fs.renameSync(oldPath, newPath);
    console.log('Directory renamed successfully.');
  } else {
    console.log('Directory not found:', oldPath);
  }
} catch (err) {
  console.error('Error renaming directory:', err);
  // Try recursive delete if rename fails
  try {
     console.log('Attempting recursive delete...');
     fs.rmSync(oldPath, { recursive: true, force: true });
     console.log('Directory deleted successfully.');
  } catch (err2) {
     console.error('Error deleting directory:', err2);
  }
}
