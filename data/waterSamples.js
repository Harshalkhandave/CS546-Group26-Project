import WaterSample from '../model/WaterSample.js';
import * as helpFun from '../helper/waterSampledataHelper.js';
import { isValidId, checkString } from '../helper/helper.js';

export const createWaterSample = async (waterSampleObj) => {
  const newSampleData = await helpFun.isValidWaterSampleData(waterSampleObj);
  const newSample = new WaterSample(newSampleData);
  const savedSample = await newSample.save();

  const result = savedSample.toObject();
  result._id = result._id.toString();

  return result;
};

export const getWaterSampleById = async (id) => {
  const validId = isValidId(id);

  const sample = await WaterSample.findById(validId).lean();
  if (!sample) return null;

  sample._id = sample._id.toString();
  return sample;
};

export const getAllWaterSamplesForABorough = async (id) => {
  const validId = isValidId(id);
  const samples = await WaterSample.find({ borough: validId }).lean();
  return samples;
};

export const getAllWaterSamples = async () => {
  const samples = await WaterSample.find({}).lean();
  samples.forEach(s => { s._id = s._id.toString(); });
  return samples;
};

export const updateWaterSample = async (id, updateObj) => {
  const validId = isValidId(id);
  const sample = await WaterSample.findById(validId);
  if (!sample) return null;

  if (updateObj.sample_number !== undefined) sample.sample_number = checkString(updateObj.sample_number, 'sample_number');
  if (updateObj.sample_date !== undefined) sample.sample_date = updateObj.sample_date;
  if (updateObj.sample_time !== undefined) sample.sample_time = updateObj.sample_time;
  if (updateObj.sample_site !== undefined) sample.sample_site = updateObj.sample_site;
  if (updateObj.sample_class !== undefined) sample.sample_class = updateObj.sample_class;
  if (updateObj.residual_free_chlorine_mg_l !== undefined) sample.residual_free_chlorine_mg_l = updateObj.residual_free_chlorine_mg_l;
  if (updateObj.turbidity_ntu !== undefined) sample.turbidity_ntu = updateObj.turbidity_ntu;
  if (updateObj.coliform_quanti_tray_mpn_100ml !== undefined) sample.coliform_quanti_tray_mpn_100ml = updateObj.coliform_quanti_tray_mpn_100ml;
  if (updateObj.e_coli_quanti_tray_mpn_100ml !== undefined) sample.e_coli_quanti_tray_mpn_100ml = updateObj.e_coli_quanti_tray_mpn_100ml;
  if (updateObj.fluoride_mg_l !== undefined) sample.fluoride_mg_l = updateObj.fluoride_mg_l;
  if (updateObj.borough !== undefined) sample.borough = updateObj.borough;

  await sample.save();
  const result = sample.toObject();
  result._id = result._id.toString();
  return result;
};

export const deleteWaterSample = async (id) => {
  const validId = isValidId(id);
  const removed = await WaterSample.findByIdAndDelete(validId);
  if (!removed) return { deleted: false };
  return { deleted: true };
};