import { createSampleSite } from '../data/sampleSites.js'; 
import fs from 'fs';
import path from 'path';

export const seedSampleSites = async () => {
  try {
    const filePath = path.join(process.cwd(), 'seedData', 'sampleSites.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const sampleSitesArray = JSON.parse(fileData);

    for (const site of sampleSitesArray) {
      try {
        const insertedSite = await createSampleSite(site);
      } catch (err) {
        console.error(`Skipping ${site.sample_site}: ${err.message || err}`);
      }
    }
    console.log('Sample Sites Seeding completed!');
  } catch (err) {
    console.error('Sample Sites Seeding failed:', err);
    process.exit(1);
  }
};

