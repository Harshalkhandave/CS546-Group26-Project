import axios from "axios";
import fs from "fs";
import { parse } from "json2csv";

const APP_TOKEN = "pssknIRVuZsuvg1c21QYX5GG2";
const URL = "https://data.cityofnewyork.us/api/v3/views/bkwf-xfky/query.json";

const pageSize = 50000;
let pageNumber = 1;
let allRows = [];

async function fetchAllCSV() {
  while (true) {
    console.log(`Fetching page ${pageNumber} ...`);
    try {
      const response = await axios.post(
        URL,
        {
          query: "SELECT *",
          page: {
            pageNumber,
            pageSize
          },
          includeSynthetic: false
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-App-Token": APP_TOKEN
          }
        }
      );

      const rows = response.data;

      if (!Array.isArray(rows)) {
        console.error("API returned unexpected format:", response.data);
        break;
      }

      console.log(`Rows returned: ${rows.length}`);

      if (rows.length === 0) {
        console.log("No more rows. Finished.");
        break;
      }

      allRows.push(...rows);
      pageNumber++;

    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      break;
    }
  }

  console.log("TOTAL ROWS:", allRows.length);

  try {
    const csv = parse(allRows);
    fs.writeFileSync("drinkingWaterSamplesRAW.csv", csv);
    console.log("Saved to drinkingWaterSamplesRAW.csv");
  } catch (err) {
    console.error("Error converting to CSV:", err);
  }
}

fetchAllCSV();
