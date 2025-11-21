import { createSampleSite } from '../data/sampleSites.js'; 
import fs from 'fs';
import path from 'path';

const seedSampleSites = async () => {
  try {
    const filePath = path.join(process.cwd(), 'seedData', 'sampleSites.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const sampleSitesArray = JSON.parse(fileData);

    for (const site of sampleSitesArray) {
      try {
        const insertedSite = await createSampleSite(
          site.sample_site,
          site.sample_station,
          site.latitude,
          site.longitude,
          site.borough,
          site.neighborhood
        );
      } catch (err) {
        console.error(`Skipping ${site.sample_site}: ${err.message || err}`);
      }
    }

    console.log('Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedSampleSites();
