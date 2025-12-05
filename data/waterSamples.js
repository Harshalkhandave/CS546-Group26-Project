import { waterSampleCollection } from '../model/index.js';
import * as helpFun from '../helper/waterSampledataHelper.js';
import { isValidId, checkString } from '../helper/helper.js';

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
  if (updateObj.sample_date !== undefined) {sample.sample_date = helpFun.isValidSample_date(updateObj.sample_date);}
  if (updateObj.sample_time !== undefined) {sample.sample_time = helpFun.isValidSample_time(updateObj.sample_time);}
  if (updateObj.sample_site !== undefined) {sample.sample_site = await helpFun.isValidWS_Sample_site(updateObj.sample_site);}
  if (updateObj.sample_class !== undefined) {sample.sample_class = helpFun.isValidSample_class(updateObj.sample_class);}
  if (updateObj.residual_free_chlorine_mg_l !== undefined) {
    sample.residual_free_chlorine_mg_l = helpFun.isValidResidual_free_chlorine_mg_l(updateObj.residual_free_chlorine_mg_l);}
  if (updateObj.turbidity_ntu !== undefined) {sample.turbidity_ntu = helpFun.isValidTurbidity_ntu(updateObj.turbidity_ntu);}
  if (updateObj.coliform_quanti_tray_mpn_100ml !== undefined){
    sample.coliform_quanti_tray_mpn_100ml = helpFun.isValidColiform_quanti_tray_mpn_100ml(updateObj.coliform_quanti_tray_mpn_100ml);}
  if (updateObj.e_coli_quanti_tray_mpn_100ml !== undefined) {
    sample.e_coli_quanti_tray_mpn_100ml = helpFun.isValidE_coli_quanti_tray_mpn_100ml(updateObj.e_coli_quanti_tray_mpn_100ml);}
  if (updateObj.fluoride_mg_l !== undefined) {sample.fluoride_mg_l = helpFun.isValidFluoride_mg_l(updateObj.fluoride_mg_l);}

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