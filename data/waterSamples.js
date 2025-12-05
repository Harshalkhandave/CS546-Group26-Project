import WaterSample from '../model/WaterSample.js';
import * as helpFun from '../helper/waterSampledataHelper.js';
import { isValidId } from '../helper/helper.js';

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
  if (!sample) throw new Error("No water sample with that id!");

  sample._id = sample._id.toString();
  return sample;
};

export const getAllWaterSamplesForABorough = async (id) => {
  const validId = isValidId(id);
  const samples = await WaterSample.find({ borough: validId }).lean();

  if(!samples || samples.length === 0) {
    throw new Error("No water samples for that borough!");
  }

  return samples;
}