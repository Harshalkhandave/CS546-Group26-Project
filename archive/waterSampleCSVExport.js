import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { waterSamples } from '../config/mongoCollections.js';

const exportWaterSamples = async () => {
  try {
    console.log("Fetching water samples from database...");
    const collection = await waterSamples();
    const docs = await collection.find({}).toArray();
    console.log(`Fetched ${docs.length} samples.`);
    const COL_ORDER = [
      "sample_number",
      "sample_date",
      "sample_time",
      "sample_site",
      "sample_class",
      "residual_free_chlorine_mg_l",
      "turbidity_ntu",
      "coliform_quanti_tray_mpn_100ml",
      "e_coli_quanti_tray_mpn_100ml",
      "fluoride_mg_l"
    ];

    const rows = docs.map(doc => {
      const row = {};
      for (const col of COL_ORDER) {
        let val = doc[col];

        if (col === "sample_time" && val != null) {
          val = String(val);
        }

        row[col] = val ?? ""; 
      }
      return row;
    });

    const csv = Papa.unparse(rows, {
      header: true,
      delimiter: ",",
      quotes: false,
      transform: (value, field) => {
        if (field === "sample_time") {
          return `"${value}"`;
        }
        return value;
      }
    });
    const outputPath = path.join(process.cwd(), "drinkinghWaterSamples.csv");
    await fs.writeFile(outputPath, csv, "utf-8");
    console.log(`CSV export complete: ${outputPath}`);
    process.exit(0);

  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
};

exportWaterSamples();
