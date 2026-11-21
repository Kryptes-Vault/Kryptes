const fs = require('fs');
const path = require('path');

const rawApps = require('./rawApps.json');
const appLogos = require('../src/lib/appLogos.json');

const normalizeSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const result = rawApps.map(app => {
  const lowerName = app.name.toLowerCase();
  
  // Find in our existing appLogos.json which has handpicked wikimedia links
  let logoUrl = null;
  
  const exactMatch = Object.keys(appLogos).find(k => (k.toLowerCase() === lowerName || lowerName.includes(k.toLowerCase())) && appLogos[k].includes('wikimedia'));
  
  if (exactMatch) {
    logoUrl = appLogos[exactMatch];
  } else {
    // Generate a simpleicons URL
    const slug = normalizeSlug(app.name);
    const color = (app.hexColor || '#000000').replace('#', '');
    logoUrl = `https://cdn.simpleicons.org/${slug}/${color}`;
  }
  
  return {
    ...app,
    logo: logoUrl
  };
});

// Write to src/lib/appDatabase.json
const outPath = path.join(__dirname, '../src/lib/appDatabase.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`Successfully wrote ${result.length} apps to appDatabase.json!`);
