import {sampleSites} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as helpFun from '../helper/sampleSitedataHelper.js';

export const createSampleSite = async (
    sample_site,
    sample_station,
    latitude,
    longitude,
    borough,
    neighborhood
) => {
  let newsampleSite = {
    sample_site,
    sample_station,
    latitude,
    longitude,
    borough,
    neighborhood
  };
  newsampleSite = await helpFun.isValidSampleSiteData(newsampleSite);
  const sampleSitesCollection = await sampleSites();
  const insertInfo = await sampleSitesCollection.insertOne(newsampleSite);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw ("Could not add sample site!");
  const newId = insertInfo.insertedId.toString();
  const insertedSampleSite = await getSampleSiteById(newId);
  return insertedSampleSite;
};

export const getAllsampleSites = async () => {
    const sampleSitesCollection = await sampleSites();
    let sampleSiteList = await sampleSitesCollection.find({}).toArray();
    if (!sampleSiteList) throw ("Could not get all sample site!");
    sampleSiteList = sampleSiteList.map((element) => {
      element._id = element._id.toString();
      return element;
    });
    return sampleSiteList;
};
  
export const getSampleSiteById = async (id) => {
    helpFun.isValidId(id);
    id = id.trim();
    const sampleSitesCollection = await sampleSites();
    const sampleSite = await sampleSitesCollection.findOne({_id: new ObjectId(id)});
    if (sampleSite === null) throw ("No sample site with that id!");
    sampleSite._id = sampleSite._id.toString();
    return sampleSite;
};