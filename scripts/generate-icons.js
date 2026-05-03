const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const sizes = [192, 512];
  
  // Create a simple SVG icon
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#000000"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="200" 
        font-weight="bold"
        fill="#FFFFFF" 
        text-anchor="middle" 
        dominant-baseline="middle">
        eS
      </text>
    </svg>
  `;

  for (const size of sizes) {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(__dirname, '..', 'public', filename);
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(filepath);
    
    console.log(`Generated ${filename}`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
