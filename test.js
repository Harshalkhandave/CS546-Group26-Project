import * as sample from './data/sampleSites.js'
import {dbConnection, closeConnection} from './config/mongoConnection.js';
const db = await dbConnection();

await db.dropDatabase();

// let dataSci =undefined;
// try {
//     dataSci = await sample.getSampleSiteByNum("1S03A-");
//     console.log(dataSci);
// }catch(e){
//   console.log (e)
// }

await closeConnection();
console.log('Done!');