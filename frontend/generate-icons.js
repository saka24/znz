const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Convert SVG to different sizes needed for Android
const generateIcons = async () => {
  const iconSvg = fs.readFileSync('./public/icon.svg');
  
  // Create directories
  const androidDir = './android/app/src/main/res';
  const iconDirs = [
    'mipmap-hdpi',
    'mipmap-mdpi', 
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
  ];
  
  // Create directories if they don't exist
  iconDirs.forEach(dir => {
    const fullPath = path.join(androidDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Icon sizes for different densities
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };
  
  // Generate icons
  for (const [dir, size] of Object.entries(sizes)) {
    console.log(`Generating ${size}x${size} icon for ${dir}...`);
    
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(androidDir, dir, 'ic_launcher.png'));
    
    // Also create round icon
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(androidDir, dir, 'ic_launcher_round.png'));
  }
  
  // Generate Play Store icon (1024x1024)
  console.log('Generating Play Store icon (1024x1024)...');
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile('./play-store-icon.png');
  
  // Generate feature graphic for Play Store (1024x500)
  console.log('Generating feature graphic...');
  const featureGraphic = `
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="500" fill="url(#bg)"/>
      <circle cx="200" cy="250" r="80" fill="white" fill-opacity="0.1"/>
      <circle cx="824" cy="250" r="80" fill="white" fill-opacity="0.1"/>
      <text x="512" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="72" font-weight="bold">SISI Chat</text>
      <text x="512" y="280" text-anchor="middle" fill="white" font-family="Arial" font-size="32" opacity="0.9">Smart Messaging with AI</text>
      <text x="512" y="350" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.7">Real-time chat • AI suggestions • Secure payments</text>
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f97316"/>
          <stop offset="50%" style="stop-color:#ea580c"/>
          <stop offset="100%" style="stop-color:#dc2626"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  
  await sharp(Buffer.from(featureGraphic))
    .png()
    .toFile('./feature-graphic.png');
  
  console.log('✅ All icons generated successfully!');
  console.log('📱 Play Store assets created:');
  console.log('   - play-store-icon.png (1024x1024)');
  console.log('   - feature-graphic.png (1024x500)');
};

generateIcons().catch(console.error);