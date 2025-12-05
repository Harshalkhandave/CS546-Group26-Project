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
        const neighborhood = s.neighborhood?.trim();
        if (!boroughName) continue;

        if (!boroughMap[boroughName]) {
            boroughMap[boroughName] = { neighborhoods: {}, site_ids: [] };
        }

        boroughMap[boroughName].site_ids.push(s.sample_site.toString());

        if (neighborhood) {
            if (!boroughMap[boroughName].neighborhoods[neighborhood]) {
                boroughMap[boroughName].neighborhoods[neighborhood] = [];
            }
            boroughMap[boroughName].neighborhoods[neighborhood].push(s.sample_site.toString());
        }
    }

    const results = [];

    for (const [bName, data] of Object.entries(boroughMap)) {
        const neighborhoodStatsArray = [];

        for (const [nName, nSiteIds] of Object.entries(data.neighborhoods)) {
            const waterData = await waterSampleCollection.find({ sample_site: { $in: nSiteIds } }).lean();

            const avg = (key) => waterData.length ? waterData.reduce((sum, x) => sum + (x[key] || 0), 0) / waterData.length : 0;

            const latest_sample_date = waterData.length
                ? waterData.reduce((a, b) => new Date(a.sample_date) > new Date(b.sample_date) ? a : b).sample_date
                : null;

            neighborhoodStatsArray.push({
                name: nName,
                stats: {
                    avg_chlorine: avg('residual_free_chlorine_mg_l'),
                    avg_turbidity: avg('turbidity_ntu'),
                    avg_coliform: avg('coliform_quanti_tray_mpn_100ml'),
                    avg_e_coli: avg('e_coli_quanti_tray_mpn_100ml'),
                    avg_fluoride: avg('fluoride_mg_l'),
                    latest_sample_date
                }
            });
        }

        const boroughSamples = await waterSampleCollection.find({ sample_site: { $in: data.site_ids } }).lean();
        const avgB = (key) => boroughSamples.length ? boroughSamples.reduce((sum, x) => sum + (x[key] || 0), 0) / boroughSamples.length : 0;
        const borough_latest_sample = boroughSamples.length
            ? boroughSamples.reduce((a, b) => new Date(a.sample_date) > new Date(b.sample_date) ? a : b).sample_date
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
                description: boroughDes[bName] || "Description not available for this borough",
                neighborhoods: neighborhoodStatsArray,
                stats: [boroughStats],
                alerts: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            results.push({ borough: bName, action: "created" });
        } else {
            existing.neighborhoods = neighborhoodStatsArray;
            existing.stats = [boroughStats];
            existing.updatedAt = new Date();
            await existing.save();
            results.push({ borough: bName, action: "updated" });
        }
    }

    return results;
};
