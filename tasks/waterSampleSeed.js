/**
 * NOTE ABOUT THIS SEEDING APPROACH
 * --------------------------------
 * Initially, we obtained the raw CSV file from NYC Open Data using an API call.
 * The script used for fetching the CSV is kept in the archive folder:
 *   - fetchWaterSamplesAPI.js
 *
 * Our original dataset contained ~160k rows. Validating each row using our
 * validator functions made the seeding process extremely slow (several hours).
 *
 * To optimize this, we performed a full one-time validation pass and inserted
 * the cleaned data into the database. After validation, we exported the final
 * sanitized dataset from the DB into a CSV file.
 *
 * This CSV file (seedData/drinkingWaterSamples.csv) now contains data that has 
 * *already passed* all validation rules. Therefore, for all future seeding runs, 
 * this script directly imports the CSV into the database without re-running 
 * the heavy validation step.
 *
 * This makes seeding significantly faster while still ensuring that the data
 * is valid and consistent.
 *
 * The original scripts used for validation and CSV export are kept in the
 * archive folder:
 *   - oldWaterSampleSeed.js
 *   - waterSampleCSVExport.js
 */


import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { waterSamples } from '../config/mongoCollections.js';
import { seedSampleSites } from './sampleSiteSeed.js';
const importWaterSamples = async () => {
  try {
    console.log("Seeding Sample Sites...");
    await seedSampleSites();

    console.log("Seeding Water Samples...");
    const csvFilePath = path.join(process.cwd(), 'seedData', 'drinkingWaterSamples.csv');
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    if (parsed.errors.length > 0) {
      console.error("CSV parsing errors:", parsed.errors);
      throw new Error("CSV parsing failed");
    }
    let rows = parsed.data;
    rows = rows.map(row => ({
        ...row,
        sample_time: row.sample_time?.trim(), 
        residual_free_chlorine_mg_l:
          row.residual_free_chlorine_mg_l === "" ? null : Number(row.residual_free_chlorine_mg_l), 
        turbidity_ntu:
          row.turbidity_ntu === "" ? null : Number(row.turbidity_ntu), 
        coliform_quanti_tray_mpn_100ml:
          row.coliform_quanti_tray_mpn_100ml === "" ? null : Number(row.coliform_quanti_tray_mpn_100ml),
        e_coli_quanti_tray_mpn_100ml:
          row.e_coli_quanti_tray_mpn_100ml === "" ? null : Number(row.e_coli_quanti_tray_mpn_100ml),
        fluoride_mg_l:
          row.fluoride_mg_l === "" ? null : Number(row.fluoride_mg_l),
    }));

    const collection = await waterSamples();
    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await collection.insertMany(batch);
    }
    console.log("Water Samples Seeding Completed!");
    process.exit(0);
  } catch (err) {
    console.error("Import failed:", err);
    process.exit(1);
  }
};

importWaterSamples();
