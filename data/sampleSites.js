import SampleSite from '../model/SampleSite.js';
import * as helpFun from '../helper/sampleSitedataHelper.js';
import { isValidId } from '../helper/helper.js';

export const createSampleSite = async (sampleSiteObj) => {
  const validatedData = await helpFun.isValidSampleSiteData(sampleSiteObj);

  const newSite = new SampleSite(validatedData);
  const savedSite = await newSite.save();

  const result = savedSite.toObject();
  result._id = result._id.toString();
  return result;
};

export const getAllSampleSites = async () => {
  const sites = await SampleSite.find({}).lean();
  if (!sites) throw new Error("Could not get all sample sites!");

  return sites.map(site => {
    site._id = site._id.toString();
    return site;
  });
};

export const getSampleSiteById = async (id) => {
  const validId = isValidId(id);

  const site = await SampleSite.findById(validId).lean();
  if (!site) throw new Error("No sample site with that id!");

  site._id = site._id.toString();
  return site;
};

export const getSampleSiteByNum = async (ssNum) => {
  const validNum = helpFun.validateSampleSiteFormat(ssNum);

  const site = await SampleSite.findOne({ sample_site: validNum }).lean();
  if (!site) throw new Error("No sample site with that number!");

  site._id = site._id.toString();
  return site;
};
