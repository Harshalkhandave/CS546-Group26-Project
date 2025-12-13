import { waterSampleCollection, sampleSiteCollection } from '../model/index.js';
import * as helpFun from '../helper/waterSampledataHelper.js'; 
import { isValidId } from '../helper/helper.js';

export const createWaterSample = async (waterSampleObj) => {
  const newSampleData = await helpFun.isValidWaterSampleData(waterSampleObj);
  const newSample = new waterSampleCollection(newSampleData);
  const savedSample = await newSample.save();

  const result = savedSample.toObject();
  result._id = result._id.toString();
  return result;
};

export const getWaterSampleById = async (id) => {
  const validId = isValidId(id);
  const sample = await waterSampleCollection.findById(validId).lean();
  if (!sample) throw new Error("No water sample with that id!");
  sample._id = sample._id.toString();
  return sample;
};

// Update: delete function that is no longer necessary

// Incorrect Implementatrion Need to correct
// export const getAllWaterSamplesForABorough = async (id) => {
//   const validId = isValidId(id);
//   const samples = await waterSampleCollection.find({ borough: validId }).lean();
//   return samples;
// };

export const getAllWaterSamples = async () => {
  const samples = await waterSampleCollection.find({}).lean();
  samples.forEach(s => { s._id = s._id.toString(); });
  return samples;
};

export const updateWaterSample = async (id, updateObj) => {
  const validId = isValidId(id);
  const sample = await waterSampleCollection.findById(validId);
  if (!sample) throw "No water sample with that id!";

  if (updateObj.sample_number !== undefined){
    const num = await helpFun.validateSampleNumFormat(updateObj.sample_number);
    const duplicate = await waterSampleCollection.findOne({
      sample_number: num,
      _id: { $ne: validId }
    });
    if (duplicate) throw "Duplicate sample_number found!";
    sample.sample_number = num;
  }

  //Validate and update only provided fields
  if (updateObj.sample_date !== undefined) {
    sample.sample_date = helpFun.isValidSample_date(updateObj.sample_date);
  }
  if (updateObj.sample_time !== undefined) {
    sample.sample_time = helpFun.isValidSample_time(updateObj.sample_time);
  }
  if (updateObj.sample_site !== undefined) {
    sample.sample_site = await helpFun.isValidWS_Sample_site(updateObj.sample_site);
  }
  if (updateObj.sample_class !== undefined) {
    sample.sample_class = helpFun.isValidSample_class(updateObj.sample_class);
  }
  if (updateObj.residual_free_chlorine_mg_l !== undefined) {
    sample.residual_free_chlorine_mg_l =
      helpFun.isValidResidual_free_chlorine_mg_l(updateObj.residual_free_chlorine_mg_l);
  }
  if (updateObj.turbidity_ntu !== undefined) {
    sample.turbidity_ntu =
      helpFun.isValidTurbidity_ntu(updateObj.turbidity_ntu);
  }
  if (updateObj.coliform_quanti_tray_mpn_100ml !== undefined){
    sample.coliform_quanti_tray_mpn_100ml =
      helpFun.isValidColiform_quanti_tray_mpn_100ml(
        updateObj.coliform_quanti_tray_mpn_100ml
      );
  }
  if (updateObj.e_coli_quanti_tray_mpn_100ml !== undefined) {
    sample.e_coli_quanti_tray_mpn_100ml =
      helpFun.isValidE_coli_quanti_tray_mpn_100ml(
        updateObj.e_coli_quanti_tray_mpn_100ml
      );
  }
  if (updateObj.fluoride_mg_l !== undefined) {
    sample.fluoride_mg_l =
      helpFun.isValidFluoride_mg_l(updateObj.fluoride_mg_l);
  }

  await sample.save();
  const result = sample.toObject();
  result._id = result._id.toString();
  return result;
};

export const deleteWaterSample = async (id) => {
  const validId = isValidId(id);
  const removed = await waterSampleCollection.findByIdAndDelete(validId);
  if (!removed) return { deleted: false };
  return { deleted: true };
};

export const getSamplesByPage = async (page) => {
  let pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

  const limit = 20;
  const skip = (pageNum - 1) * limit;
  const startDate = new Date('2023-01-01T00:00:00.000Z');
  const endDate = new Date('2024-12-31T23:59:59.999Z');

  const samples = await waterSampleCollection
    .find({
      sample_date: { $gte: startDate, $lte: endDate }
    })
    .sort({ sample_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (samples.length === 0) return [];

  const siteIds = [...new Set(samples.map(s => s.sample_site))];

  const siteDocs = await sampleSiteCollection
    .find({ sample_site: { $in: siteIds } })
    .select('sample_site borough')
    .lean();

  const siteMap = {};
  siteDocs.forEach(doc => {
    siteMap[doc.sample_site] = doc.borough || 'Unknown Borough';
  });

  return samples.map((s) => ({
    _id: s._id.toString(),
    sample_number: s.sample_number,
    sample_site: s.sample_site || 'N/A',
    //Read borough name from map
    borough: siteMap[s.sample_site] || 'Unknown',
    date: s.sample_date
      ? s.sample_date.toISOString().split('T')[0]
      : 'N/A',
    chlorine: s.residual_free_chlorine_mg_l,
    turbidity: s.turbidity_ntu,
    fluoride: s.fluoride_mg_l,
    coliform: s.coliform_quanti_tray_mpn_100ml,
    ecoli: s.e_coli_quanti_tray_mpn_100ml
  }));
};
