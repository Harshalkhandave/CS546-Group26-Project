import {waterSamples} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as helpFun from '../helper/waterSampledataHelper.js';
import {isValidId} from '../helper/helper.js';

export const createWaterSample = async (waterSampleObj) => {
    let newSample = await helpFun.isValidWaterSampleData(waterSampleObj);

    const waterSamplesCollection = await waterSamples();
    const insertInfo = await waterSamplesCollection.insertOne(newSample);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw ("Could not add sample site!");
    const newId = insertInfo.insertedId.toString();
    const insertedSample = await getWaterSampleById(newId);
    return insertedSample;
};
  
export const getWaterSampleById = async (id) => {
    id=isValidId(id);
    const waterSamplesCollection = await waterSamples();
    const waterSample = await waterSamplesCollection.findOne({_id: new ObjectId(id)});
    if (waterSample === null) throw ("No water sample with that id!");
    waterSample._id = waterSample._id.toString();
    return waterSample;
};
