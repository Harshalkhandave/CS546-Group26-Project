import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { createWaterSample } from '../data/waterSamples.js';
import { seedSampleSites } from '../tasks/sampleSiteSeed.js';

const seedWaterSamples = async () => {
  try {
    console.log("Seeding Sample Sites...");
    await seedSampleSites();

    const csvFilePath = path.join(process.cwd(), 'seedData', 'drinkingWaterSamples.csv');
    const fileContent = await fs.readFile(csvFilePath, 'utf-8');
    const { data, errors } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.error("CSV parsing errors:", errors);
      throw new Error("CSV parsing failed");
    }

    for (const sample of data) {
      try {
        const insertedSample = await createWaterSample(sample);
        console.log(`Inserted sample: ${insertedSample.sample_number}`);
      } catch (err) {
        console.error(`Error inserting sample ${sample.sample_number}:`, err.message || err);
      }
    }
    console.log("Water Samples seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedWaterSamples();
