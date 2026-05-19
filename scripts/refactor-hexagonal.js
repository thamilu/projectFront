const fs = require('fs');
const path = require('path');

const BASE_DIR = 'G:\\Project\\eshop_back\\src\\main\\java';

const HEX_MOVES = [
  {
    module: 'catalog',
    oldInterface: 'com.eshop.app.catalog.application.service.ProductService',
    newInterface: 'com.eshop.app.catalog.application.port.in.ProductUseCase'
  },
  {
    module: 'order',
    oldInterface: 'com.eshop.app.order.application.service.OrderService',
    newInterface: 'com.eshop.app.order.application.port.in.OrderUseCase'
  },
  {
    module: 'payment',
    oldInterface: 'com.eshop.app.payment.application.service.PaymentService',
    newInterface: 'com.eshop.app.payment.application.port.in.PaymentUseCase'
  },
  {
    module: 'cart',
    oldInterface: 'com.eshop.app.cart.application.service.CartService',
    newInterface: 'com.eshop.app.cart.application.port.in.CartUseCase'
  },
  {
    module: 'notification',
    oldInterface: 'com.eshop.app.notification.application.service.NotificationService',
    newInterface: 'com.eshop.app.notification.application.port.in.NotificationUseCase'
  }
];

function packageToPath(pkg) {
  return path.join(BASE_DIR, pkg.replace(/\./g, path.sep)) + '.java';
}

function getPackageName(fullClassName) {
  return fullClassName.substring(0, fullClassName.lastIndexOf('.'));
}

function getSimpleName(fullClassName) {
  return fullClassName.substring(fullClassName.lastIndexOf('.') + 1);
}

console.log('🚀 Starting Hexagonal Port migration...');

HEX_MOVES.forEach(m => {
  const fromPath = packageToPath(m.oldInterface);
  const toPath = packageToPath(m.newInterface);
  const toDir = path.dirname(toPath);

  if (fs.existsSync(fromPath)) {
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }

    let content = fs.readFileSync(fromPath, 'utf8');
    const oldPackage = getPackageName(m.oldInterface);
    const newPackage = getPackageName(m.newInterface);
    const oldName = getSimpleName(m.oldInterface);
    const newName = getSimpleName(m.newInterface);
    
    content = content.replace(`package ${oldPackage};`, `package ${newPackage};`);
    content = content.replace(`public interface ${oldName}`, `public interface ${newName}`);
    
    fs.writeFileSync(toPath, content, 'utf8');
    fs.unlinkSync(fromPath);
    console.log(`✅ Moved & Renamed Interface: ${m.oldInterface} -> ${m.newInterface}`);
  }
});

// Update all references in the codebase
function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      if (path.extname(f) === '.java') {
        callback(dirPath);
      }
    }
  });
};

walk(BASE_DIR, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  HEX_MOVES.forEach(m => {
    const oldName = getSimpleName(m.oldInterface);
    const newName = getSimpleName(m.newInterface);

    // Replace imports
    content = content.replace(new RegExp(`import ${m.oldInterface};`, 'g'), `import ${m.newInterface};`);
    
    // Replace type usages
    // Only replace if it's used as a type (followed by whitespace, bracket, or used in 'implements')
    content = content.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔗 Updated references in: ${path.relative(BASE_DIR, filePath)}`);
  }
});

console.log('✨ Hexagonal Port migration complete.');
