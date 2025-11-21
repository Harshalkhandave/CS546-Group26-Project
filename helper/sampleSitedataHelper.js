import { ObjectId } from "mongodb";
import {sampleSites} from '../config/mongoCollections.js';

export const checkString = (str, varName) => {
  if (!str) throw `${varName} is required`;
  if (typeof str !== "string") throw `${varName} must be a string`;
  str = str.trim();
  if (str.length === 0) throw `${varName} cannot be empty or just spaces`;
};

export const isValidId = (id) => {
  checkString(id, "id");
  id = id.trim();
  if (!ObjectId.isValid(id)) throw `Invalid ObjectId format`;
};

export const isValidSample_site = async (sample_site) => {
  checkString(sample_site, "sample_site");
  // allow letters & digits
  const regex = /^[A-Za-z0-9]+$/;
  if (!regex.test(sample_site)) throw `sample_site can only contain letters and numbers`;
  const escaped = sample_site.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const sampleSitesCollection = await sampleSites();
  const query = {sample_site: { $regex: `^${escaped}$`, $options: 'i' }};
  const existingsampleSite = await sampleSitesCollection.findOne(query);
  if (existingsampleSite) {
      throw ("Duplicate sample site found!");
  }
};

export const isValidSample_station = (sample_station) => {
  checkString(sample_station, "sample_station");
};

export const isValidLatitude = (lat) => {
  if (lat === undefined || lat === null) throw `latitude is required`;
  if (typeof lat === "string") lat = Number(lat);
  if (isNaN(lat)) throw "latitude must be a valid number";
  if (lat < 40.47729800 || lat > 40.91769100)
    throw `latitude must be a valid NYC latitude`;
  return lat;
};

export const isValidLongitude = (lng) => {
  if (lng === undefined || lng === null) throw `longitude is required`;
  if (typeof lng === "string") lng = Number(lng);
  if (isNaN(lng)) throw "longitude must be a valid number";
  if (lng < -74.26036900 || lng > -73.69920600)
    throw `longitude must be a valid NYC longitude`;
  return lng;
};

export const isValidBorough = (borough) => {
  checkString(borough, "borough");
  const allowed = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];
  if (!allowed.includes(borough))
    throw `borough must be one of: ${allowed.join(", ")}`;
};

export const isValidNeighborhood = (neighborhood) => {
  checkString(neighborhood, "neighborhood");
};

export const isValidSampleSiteData = async({ 
  sample_site, 
  sample_station, 
  latitude, 
  longitude, 
  borough, 
  neighborhood 
}) => {
  await isValidSample_site(sample_site);
  isValidSample_station(sample_station);
  latitude=isValidLatitude(latitude);
  longitude=isValidLongitude(longitude);
  isValidBorough(borough);
  isValidNeighborhood(neighborhood);
  return {sample_site, 
    sample_station, 
    latitude, 
    longitude, 
    borough, 
    neighborhood };
}
