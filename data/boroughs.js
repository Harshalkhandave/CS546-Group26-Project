import { boroughCollection, sampleSiteCollection, waterSampleCollection } from '../model/index.js';
import fs from 'fs';

const boroughDes = JSON.parse(
  fs.readFileSync(new URL('../seedData/boroughsDescription.json', import.meta.url))
);

export const createOrUpdateBoroughs = async () => {
  const siteList = await sampleSiteCollection.find({}).lean();
  const boroughMap = {};

  for (const s of siteList) {
    const boroughName = s.borough?.trim();
    if (!boroughName) continue;

    if (!boroughMap[boroughName]) {
      boroughMap[boroughName] = { site_ids: [] };
    }

    boroughMap[boroughName].site_ids.push(s.sample_site.toString());
  }

  const results = [];

  for (const [bName, data] of Object.entries(boroughMap)) {
    const neighborhoodStatsArray = [];

    const boroughSamples = await waterSampleCollection
      .find({ sample_site: { $in: data.site_ids } })
      .lean();

    const avgB = (key) =>
      boroughSamples.length
        ? boroughSamples.reduce((sum, x) => sum + (Number(x[key]) || 0), 0) / boroughSamples.length
        : 0;

    const borough_latest_sample = boroughSamples.length
      ? boroughSamples.reduce((a, b) =>
          new Date(a.sample_date) > new Date(b.sample_date) ? a : b
        ).sample_date
      : null;

    const boroughStats = {
      avg_chlorine: avgB('residual_free_chlorine_mg_l'),
      avg_turbidity: avgB('turbidity_ntu'),
      avg_coliform: avgB('coliform_quanti_tray_mpn_100ml'),
      avg_e_coli: avgB('e_coli_quanti_tray_mpn_100ml'),
      avg_fluoride: avgB('fluoride_mg_l'),
      latest_sample_date: borough_latest_sample
    };

    const existing = await boroughCollection.findOne({ name: bName });

    if (!existing) {
      await boroughCollection.create({
        name: bName,
        description: boroughDes[bName] || 'Description not available for this borough',
        neighborhoods: neighborhoodStatsArray,
        stats: [boroughStats],
        alerts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      results.push({ borough: bName, action: 'created' });
    } else {
      existing.neighborhoods = neighborhoodStatsArray;
      existing.stats = [boroughStats];
      existing.updatedAt = new Date();
      await existing.save();
      results.push({ borough: bName, action: 'updated' });
    }
  }

  return results;
};

export async function getBoroughsDataByMonthYear(year, month) {
  const y = Number(year);
  const m = month !== undefined ? Number(month) : null;

  if (!Number.isInteger(y) || y < 2015 || y > 2025) {
    throw new Error('Invalid year! Must be between 2015 and 2025.');
  }

  if (m !== null) {
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new Error('Invalid month! Must be between 1 and 12.');
    }
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    return aggregateByDateRange(start, end);
  }

  const startOfYear = new Date(y, 0, 1);
  const endOfYear = new Date(y, 11, 31, 23, 59, 59);
  return aggregateByDateRange(startOfYear, endOfYear);
}

async function aggregateByDateRange(start, end) {
  return await waterSampleCollection
    .aggregate([
      {
        $lookup: {
          from: 'samplesites',
          localField: 'sample_site',
          foreignField: 'sample_site',
          as: 'site'
        }
      },
      { $unwind: '$site' },
      {
        $match: {
          sample_date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$site.borough',
          avg_chlorine: { $avg: '$residual_free_chlorine_mg_l' },
          avg_turbidity: { $avg: '$turbidity_ntu' },
          avg_coliform: { $avg: '$coliform_quanti_tray_mpn_100ml' },
          avg_e_coli: { $avg: '$e_coli_quanti_tray_mpn_100ml' },
          avg_fluoride: { $avg: '$fluoride_mg_l' },
          sample_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'boroughs',
          localField: '_id',
          foreignField: 'name',
          as: 'boroughDoc'
        }
      },
      {
        $project: {
          borough: '$_id',
          _id: '$boroughDoc._id',
          avg_chlorine: 1,
          avg_turbidity: 1,
          avg_coliform: 1,
          avg_e_coli: 1,
          avg_fluoride: 1,
          sample_count: 1
        }
      },
      { $sort: { borough: 1 } }
    ])
    .exec();
}

// ---------------- Trend Analytics (2023 vs 2024) ----------------

async function aggregateTrendData(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  return await waterSampleCollection
    .aggregate([
      {
        $lookup: {
          from: 'samplesites',
          localField: 'sample_site',
          foreignField: 'sample_site',
          as: 'site'
        }
      },
      { $unwind: '$site' },
      { $match: { sample_date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$site.borough',
          avg_chlorine: { $avg: '$residual_free_chlorine_mg_l' },
          avg_turbidity: { $avg: '$turbidity_ntu' },
          avg_coliform: { $avg: '$coliform_quanti_tray_mpn_100ml' },
          avg_e_coli: { $avg: '$e_coli_quanti_tray_mpn_100ml' },
          avg_fluoride: { $avg: '$fluoride_mg_l' }
        }
      },
      {
        $project: {
          _id: 0,
          borough: '$_id',
          avg_chlorine: 1,
          avg_turbidity: 1,
          avg_coliform: 1,
          avg_e_coli: 1,
          avg_fluoride: 1
        }
      },
      { $sort: { borough: 1 } }
    ])
    .exec();
}

export async function getBoroughTrends() {
  const [data2023, data2024] = await Promise.all([
    aggregateTrendData(2023),
    aggregateTrendData(2024)
  ]);

  const map2023 = data2023.reduce((m, item) => {
    m[item.borough] = item;
    return m;
  }, {});

  const calcChange = (v2024, v2023) => {
    const a = Number(v2024) || 0;
    const b = Number(v2023) || 0;
    if (b === 0) return a > 0 ? 100 : 0;
    return ((a - b) / b) * 100;
  };

  return data2024.map((d2024) => {
    const d2023 = map2023[d2024.borough] || {};
    return {
      borough: d2024.borough,
      chlorine_change: calcChange(d2024.avg_chlorine, d2023.avg_chlorine),
      turbidity_change: calcChange(d2024.avg_turbidity, d2023.avg_turbidity),
      ecoli_change: calcChange(d2024.avg_e_coli, d2023.avg_e_coli),
      fluoride_change: calcChange(d2024.avg_fluoride, d2023.avg_fluoride),
      stats2024: d2024
    };
  });
}
