import { boroughs, sampleSites, waterSamples } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import fs from 'fs';
const boroughDes = JSON.parse(
    fs.readFileSync(new URL('../seedData/boroughsDescription.json', import.meta.url))
);

export const createOrUpdateBoroughs = async () => {
    const sampleSitesCollection = await sampleSites();
    const waterSamplesCollection = await waterSamples();
    const boroughsCollection = await boroughs();

    const siteList = await sampleSitesCollection.find({}).toArray();
    const boroughMap = {};

    for (const s of siteList) {
        const boroughName = s.borough?.trim();
        const neighborhood = s.neighborhood?.trim();
        if (!boroughName) continue;
        if (!boroughMap[boroughName]) {
            boroughMap[boroughName] = {
                neighborhoods: {},   
                site_ids: []
            };
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
            const waterData = await waterSamplesCollection.find({ sample_site: { $in: nSiteIds } }).toArray();
            let avg_chlorine = 0,
                avg_turbidity = 0,
                avg_coliform = 0,
                avg_e_coli = 0,
                avg_fluoride = 0;
            if (waterData.length > 0) {
                avg_chlorine = waterData.reduce((s, x) => s + (x.residual_free_chlorine_mg_l || 0), 0) / waterData.length;
                avg_turbidity = waterData.reduce((s, x) => s + (x.turbidity_ntu || 0), 0) / waterData.length;
                avg_coliform = waterData.reduce((s, x) => s + (x.coliform_quanti_tray_mpn_100ml || 0), 0) / waterData.length;
                avg_e_coli = waterData.reduce((s, x) => s + (x.e_coli_quanti_tray_mpn_100ml || 0), 0) / waterData.length;
                avg_fluoride = waterData.reduce((s, x) => s + (x.fluoride_mg_l || 0), 0) / waterData.length;
            }
            const latest_sample_date =
                waterData.length > 0
                ? waterData.sort((a, b) => new Date(b.sample_date) - new Date(a.sample_date))[0].sample_date
                : null;
            neighborhoodStatsArray.push({
                name: nName,
                stats: {
                avg_chlorine,
                avg_turbidity,
                avg_coliform,
                avg_e_coli,
                avg_fluoride,
                latest_sample_date
                }
            });
        }

        const boroughSamples = await waterSamplesCollection.find({
        sample_site: { $in: data.site_ids }
        }).toArray();

        let b_avg_chlorine = 0,
        b_avg_turbidity = 0,
        b_avg_coliform = 0,
        b_avg_e_coli = 0,
        b_avg_fluoride = 0;

        if (boroughSamples.length > 0) {
        b_avg_chlorine =
            boroughSamples.reduce((s, x) => s + (x.residual_free_chlorine_mg_l || 0), 0) / boroughSamples.length;

        b_avg_turbidity =
            boroughSamples.reduce((s, x) => s + (x.turbidity_ntu || 0), 0) / boroughSamples.length;

        b_avg_coliform =
            boroughSamples.reduce((s, x) => s + (x.coliform_quanti_tray_mpn_100ml || 0), 0) / boroughSamples.length;

        b_avg_e_coli =
            boroughSamples.reduce((s, x) => s + (x.e_coli_quanti_tray_mpn_100ml || 0), 0) / boroughSamples.length;

        b_avg_fluoride =
            boroughSamples.reduce((s, x) => s + (x.fluoride_mg_l || 0), 0) / boroughSamples.length;
        }

        const borough_latest_sample =
        boroughSamples.length > 0
            ? boroughSamples.sort((a, b) => new Date(b.sample_date) - new Date(a.sample_date))[0].sample_date
            : null;

        const boroughStats = {
        avg_chlorine: b_avg_chlorine,
        avg_turbidity: b_avg_turbidity,
        avg_coliform: b_avg_coliform,
        avg_e_coli: b_avg_e_coli,
        avg_fluoride: b_avg_fluoride,
        latest_sample_date: borough_latest_sample
        };

        const existing = await boroughsCollection.findOne({ name: bName });

        if (!existing) {
        await boroughsCollection.insertOne({
            _id: new ObjectId(),
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
        await boroughsCollection.updateOne(
            { _id: existing._id },
            {
            $set: {
                neighborhoods: neighborhoodStatsArray,
                stats: [boroughStats],
                updatedAt: new Date()
            }
            }
        );
        results.push({ borough: bName, action: "updated" });
        }
    }

    return results;
};
