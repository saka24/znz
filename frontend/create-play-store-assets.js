const sharp = require('sharp');
const fs = require('fs');

// Create additional Play Store assets
const createPlayStoreAssets = async () => {
  
  // 1. Create Promotional Banner (320x180)
  const promoBanner = `
    <svg width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="180" fill="url(#promoBg)"/>
      <circle cx="280" cy="40" r="25" fill="white" fill-opacity="0.1"/>
      <text x="160" y="70" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">SISI Chat</text>
      <text x="160" y="95" text-anchor="middle" fill="white" font-family="Arial" font-size="12" opacity="0.9">Smart Messaging with AI</text>
      <text x="160" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="10" opacity="0.8">Real-time • AI Suggestions • Payments</text>
      <rect x="120" y="140" width="80" height="25" rx="12" fill="white" fill-opacity="0.2"/>
      <text x="160" y="155" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">Download Now</text>
      <defs>
        <linearGradient id="promoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f97316"/>
          <stop offset="100%" style="stop-color:#ea580c"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  
  await sharp(Buffer.from(promoBanner))
    .png()
    .toFile('./promo-banner-320x180.png');
  
  // 2. Create TV Banner (1280x720) for Android TV
  const tvBanner = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="url(#tvBg)"/>
      <circle cx="200" cy="360" r="100" fill="white" fill-opacity="0.05"/>
      <circle cx="1080" cy="360" r="120" fill="white" fill-opacity="0.05"/>
      <text x="640" y="300" text-anchor="middle" fill="white" font-family="Arial" font-size="96" font-weight="bold">SISI Chat</text>
      <text x="640" y="380" text-anchor="middle" fill="white" font-family="Arial" font-size="48" opacity="0.9">Smart Messaging Platform</text>
      <text x="640" y="450" text-anchor="middle" fill="white" font-family="Arial" font-size="32" opacity="0.8">AI-Powered • Real-time • Secure Payments</text>
      <rect x="540" y="520" width="200" height="60" rx="30" fill="white" fill-opacity="0.15"/>
      <text x="640" y="560" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">Available Now</text>
      <defs>
        <linearGradient id="tvBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f97316"/>
          <stop offset="50%" style="stop-color:#ea580c"/>
          <stop offset="100%" style="stop-color:#dc2626"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  
  await sharp(Buffer.from(tvBanner))
    .png()
    .toFile('./tv-banner-1280x720.png');
  
  // 3. Create Social Media Assets
  
  // Instagram Post (1080x1080)
  const instagramPost = `
    <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1080" fill="url(#igBg)"/>
      <circle cx="540" cy="400" r="120" fill="white" fill-opacity="0.9"/>
      <circle cx="480" cy="350" r="20" fill="#f97316"/>
      <circle cx="540" cy="350" r="20" fill="#f97316"/>
      <circle cx="600" cy="350" r="20" fill="#f97316"/>
      <path d="M420 380 Q540 420 660 380 Q660 450 540 480 Q420 450 420 380 Z" fill="white" fill-opacity="0.1"/>
      <text x="540" y="580" text-anchor="middle" fill="white" font-family="Arial" font-size="64" font-weight="bold">SISI Chat</text>
      <text x="540" y="640" text-anchor="middle" fill="white" font-family="Arial" font-size="32" opacity="0.9">Now Available!</text>
      <text x="540" y="720" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.8">Smart messaging with AI</text>
      <text x="540" y="780" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.8">Download on Google Play</text>
      <text x="540" y="920" text-anchor="middle" fill="white" font-family="Arial" font-size="18" opacity="0.7">#SISIChat #SmartMessaging #AI #ChatApp</text>
      <defs>
        <radialGradient id="igBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#f97316"/>
          <stop offset="100%" style="stop-color:#dc2626"/>
        </radialGradient>
      </defs>
    </svg>
  `;
  
  await sharp(Buffer.from(instagramPost))
    .png()
    .toFile('./instagram-post-1080x1080.png');
  
  // Twitter Header (1500x500)
  const twitterHeader = `
    <svg width="1500" height="500" viewBox="0 0 1500 500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1500" height="500" fill="url(#twitterBg)"/>
      <circle cx="150" cy="250" r="80" fill="white" fill-opacity="0.1"/>
      <circle cx="1350" cy="250" r="80" fill="white" fill-opacity="0.1"/>
      <text x="750" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="72" font-weight="bold">SISI Chat</text>
      <text x="750" y="260" text-anchor="middle" fill="white" font-family="Arial" font-size="32" opacity="0.9">Smart Messaging • AI-Powered • Secure</text>
      <text x="750" y="320" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.8">Real-time translation • Payment integration • Modern design</text>
      <text x="750" y="380" text-anchor="middle" fill="white" font-family="Arial" font-size="20" opacity="0.7">Download now on Google Play Store</text>
      <defs>
        <linearGradient id="twitterBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f97316"/>
          <stop offset="50%" style="stop-color:#ea580c"/>
          <stop offset="100%" style="stop-color:#f97316"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  
  await sharp(Buffer.from(twitterHeader))
    .png()
    .toFile('./twitter-header-1500x500.png');
  
  // 4. Create App Screenshot Templates (for reference)
  const screenshotTemplate1 = `
    <svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
      <!-- Phone mockup background -->
      <rect width="720" height="1280" fill="#f8fafc" rx="40"/>
      
      <!-- Status bar -->
      <rect width="720" height="60" fill="#f97316"/>
      <text x="360" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">SISI Chat</text>
      
      <!-- Chat list mockup -->
      <rect x="40" y="120" width="640" height="80" fill="white" rx="8"/>
      <circle cx="90" cy="160" r="25" fill="#fed7aa"/>
      <text x="90" y="167" text-anchor="middle" fill="#ea580c" font-family="Arial" font-size="18" font-weight="bold">J</text>
      <text x="140" y="150" fill="#374151" font-family="Arial" font-size="18" font-weight="bold">John Doe</text>
      <text x="140" y="175" fill="#6b7280" font-family="Arial" font-size="14">Hey! How are you doing?</text>
      <text x="650" y="150" text-anchor="end" fill="#9ca3af" font-family="Arial" font-size="12">2:30 PM</text>
      
      <rect x="40" y="220" width="640" height="80" fill="white" rx="8"/>
      <circle cx="90" cy="260" r="25" fill="#fed7aa"/>
      <text x="90" y="267" text-anchor="middle" fill="#ea580c" font-family="Arial" font-size="18" font-weight="bold">M</text>
      <text x="140" y="250" fill="#374151" font-family="Arial" font-size="18" font-weight="bold">Mary Smith</text>
      <text x="140" y="275" fill="#6b7280" font-family="Arial" font-size="14">Thanks for the payment! 💰</text>
      <text x="650" y="250" text-anchor="end" fill="#9ca3af" font-family="Arial" font-size="12">1:45 PM</text>
      
      <!-- Bottom text -->
      <text x="360" y="1200" text-anchor="middle" fill="#f97316" font-family="Arial" font-size="24" font-weight="bold">Smart Conversations</text>
      <text x="360" y="1230" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">AI-powered messaging experience</text>
    </svg>
  `;
  
  await sharp(Buffer.from(screenshotTemplate1))
    .png()
    .toFile('./screenshot-template-chat-list.png');
  
  console.log('✅ All Play Store assets created successfully!');
  console.log('\n📱 Assets created:');
  console.log('   - promo-banner-320x180.png (Promotional banner)');
  console.log('   - tv-banner-1280x720.png (Android TV banner)');
  console.log('   - instagram-post-1080x1080.png (Social media)');
  console.log('   - twitter-header-1500x500.png (Twitter header)');
  console.log('   - screenshot-template-chat-list.png (Screenshot template)');
  console.log('\n🚀 Ready for Play Store submission!');
};

createPlayStoreAssets().catch(console.error);