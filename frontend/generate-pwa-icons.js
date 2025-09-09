const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Generate PWA icons from SVG
const generatePWAIcons = async () => {
  const iconSvg = fs.readFileSync('./public/icon.svg');
  
  // Create icons directory
  const iconsDir = './public/icons';
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // PWA icon sizes
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Generate icons
  for (const size of sizes) {
    console.log(`Generating ${size}x${size} PWA icon...`);
    
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  }
  
  // Generate Apple Touch Icons
  console.log('Generating Apple Touch Icons...');
  
  // Apple Touch Icon sizes
  const appleSizes = [120, 152, 167, 180];
  
  for (const size of appleSizes) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join('./public', `apple-touch-icon-${size}x${size}.png`));
  }
  
  // Generate default Apple Touch Icon
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
  
  // Generate favicon
  console.log('Generating favicon...');
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile('./public/favicon-32x32.png');
  
  await sharp(iconSvg)
    .resize(16, 16)
    .png()
    .toFile('./public/favicon-16x16.png');
  
  // Generate high-res favicon
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile('./public/favicon-192x192.png');
  
  // Generate splash screens for iOS
  console.log('Generating iOS splash screens...');
  
  const splashScreens = [
    { width: 750, height: 1334, name: 'iphone6' }, // iPhone 6/7/8
    { width: 1125, height: 2436, name: 'iphonex' }, // iPhone X/XS
    { width: 828, height: 1792, name: 'iphonexr' }, // iPhone XR
    { width: 1242, height: 2688, name: 'iphonexsmax' }, // iPhone XS Max
    { width: 1536, height: 2048, name: 'ipad' }, // iPad
    { width: 2048, height: 2732, name: 'ipadpro' } // iPad Pro
  ];
  
  for (const screen of splashScreens) {
    const splashSvg = `
      <svg width="${screen.width}" height="${screen.height}" viewBox="0 0 ${screen.width} ${screen.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${screen.width}" height="${screen.height}" fill="url(#splashBg)"/>
        <circle cx="${screen.width/2}" cy="${screen.height/2 - 50}" r="80" fill="white" fill-opacity="0.9"/>
        <circle cx="${screen.width/2 - 25}" cy="${screen.height/2 - 75}" r="12" fill="#f97316"/>
        <circle cx="${screen.width/2}" cy="${screen.height/2 - 75}" r="12" fill="#f97316"/>
        <circle cx="${screen.width/2 + 25}" cy="${screen.height/2 - 75}" r="12" fill="#f97316"/>
        <path d="M${screen.width/2 - 40} ${screen.height/2 - 50} Q${screen.width/2} ${screen.height/2 - 20} ${screen.width/2 + 40} ${screen.height/2 - 50} Q${screen.width/2 + 40} ${screen.height/2} ${screen.width/2} ${screen.height/2 + 20} Q${screen.width/2 - 40} ${screen.height/2} ${screen.width/2 - 40} ${screen.height/2 - 50} Z" fill="white" fill-opacity="0.1"/>
        <text x="${screen.width/2}" y="${screen.height/2 + 80}" text-anchor="middle" fill="white" font-family="Arial" font-size="48" font-weight="bold">SISI Chat</text>
        <text x="${screen.width/2}" y="${screen.height/2 + 120}" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.9">Smart Messaging</text>
        <defs>
          <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f97316"/>
            <stop offset="50%" style="stop-color:#ea580c"/>
            <stop offset="100%" style="stop-color:#dc2626"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    
    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile(`./public/splash-${screen.name}.png`);
  }
  
  console.log('✅ All PWA icons and splash screens generated successfully!');
  console.log('\n📱 PWA assets created:');
  console.log('   - Icons: /public/icons/ (8 sizes)');
  console.log('   - Apple Touch Icons: /public/ (5 sizes)');
  console.log('   - Favicons: /public/ (3 sizes)');
  console.log('   - iOS Splash Screens: /public/ (6 devices)');
  console.log('\n🚀 Your PWA is ready for installation!');
};

generatePWAIcons().catch(console.error);