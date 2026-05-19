const fs = require('fs');
const path = require('path');

const BASE_DIR = 'G:\\Project\\eshop_back\\src\\main\\java';
const MOVES = [
  { from: 'com.eshop.app.shared.api.request.LoginRequest', to: 'com.eshop.app.user.api.request.LoginRequest' },
  { from: 'com.eshop.app.shared.api.request.LogoutRequest', to: 'com.eshop.app.user.api.request.LogoutRequest' },
  { from: 'com.eshop.app.shared.api.request.RegisterRequest', to: 'com.eshop.app.user.api.request.RegisterRequest' },
  { from: 'com.eshop.app.shared.api.request.SimpleRegisterRequest', to: 'com.eshop.app.user.api.request.SimpleRegisterRequest' },
  { from: 'com.eshop.app.shared.api.request.ChangePasswordRequest', to: 'com.eshop.app.user.api.request.ChangePasswordRequest' },
  { from: 'com.eshop.app.shared.api.request.ForgotPasswordRequest', to: 'com.eshop.app.user.api.request.ForgotPasswordRequest' },
  { from: 'com.eshop.app.shared.api.request.PasswordChangeRequest', to: 'com.eshop.app.user.api.request.PasswordChangeRequest' },
  { from: 'com.eshop.app.shared.api.request.RefreshTokenRequest', to: 'com.eshop.app.user.api.request.RefreshTokenRequest' },
  { from: 'com.eshop.app.shared.api.request.ResetPasswordRequest', to: 'com.eshop.app.user.api.request.ResetPasswordRequest' },
  { from: 'com.eshop.app.shared.api.request.CheckoutRequest', to: 'com.eshop.app.order.api.request.CheckoutRequest' },
  { from: 'com.eshop.app.shared.api.request.ShippingRequest', to: 'com.eshop.app.shipping.api.request.ShippingRequest' },
  { from: 'com.eshop.app.shared.api.request.TrackingUpdateRequest', to: 'com.eshop.app.shipping.api.request.TrackingUpdateRequest' },
  { from: 'com.eshop.app.shared.api.request.RefundRequest', to: 'com.eshop.app.payment.api.request.RefundRequest' },
  { from: 'com.eshop.app.shared.domain.entity.Shipping', to: 'com.eshop.app.shipping.domain.entity.Shipping' },
  { from: 'com.eshop.app.shared.domain.entity.ShippingClass', to: 'com.eshop.app.shipping.domain.entity.ShippingClass' }
];

function packageToPath(pkg) {
  return path.join(BASE_DIR, pkg.replace(/\./g, path.sep)) + '.java';
}

function getPackageName(fullClassName) {
  return fullClassName.substring(0, fullClassName.lastIndexOf('.'));
}

console.log('🚀 Starting backend architectural leakage purge...');

// 1. Move files and update their internal package declaration
MOVES.forEach(m => {
  const fromPath = packageToPath(m.from);
  const toPath = packageToPath(m.to);
  const toDir = path.dirname(toPath);

  if (fs.existsSync(fromPath)) {
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }

    let content = fs.readFileSync(fromPath, 'utf8');
    const oldPackage = getPackageName(m.from);
    const newPackage = getPackageName(m.to);
    
    content = content.replace(`package ${oldPackage};`, `package ${newPackage};`);
    
    fs.writeFileSync(toPath, content, 'utf8');
    fs.unlinkSync(fromPath);
    console.log(`✅ Moved & Patched: ${m.from} -> ${m.to}`);
  } else {
    console.log(`⚠️ Skip (Not Found): ${m.from}`);
  }
});

// 2. Update imports across the whole codebase
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

  MOVES.forEach(m => {
    // Replace full imports
    content = content.replace(new RegExp(`import ${m.from};`, 'g'), `import ${m.to};`);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔗 Updated imports in: ${path.relative(BASE_DIR, filePath)}`);
  }
});

console.log('✨ Backend purge complete.');
