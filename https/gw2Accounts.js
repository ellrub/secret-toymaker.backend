/*
THis manages everything account related sugh as adding api keys, nots, getting the assigned giftees and volunteering for mroe
*/
const functions = require('firebase-functions');
const rp = require('request-promise-native');
const db = require('../config/db');
const { getUUID, volunteerForNewGiftees } = require('../utils/utils');
const { EVENT } = require("../config/constants");

const updateApiKey = functions.https.onCall(async({user,apiKey}, context) => {
  // may tern the request into a genralised function if we get the mail endpoint, but for now it is sufficent

  // first check key
  let url = "https://api.guildwars2.com/v2/account?v=2019-11-18T00:00:00Z&access_token="+apiKey
  let accountData = await rp({url:url,resolveWithFullResponse:true}).then((response) => {return { headers: response.headers, body: response.body }}).catch((error) => {return { error: error }})

  if(accountData.error){
    // Somethign went wrong went wrong

    if(accountData.error.statusCode === 401){
      return {error: "API key does not have access"}
    }
    if(accountData.error.statusCode === 404){
      return {error: "Link not found"}
    }
    return {error: "Unable to get data"}
  }

  // result is json so format it
  let result = JSON.parse(accountData.body)

  // figure pout if the person is F2P
  let freeToPlay = result.access.indexOf("PlayForFree ") !== -1

  // get uuid
  let uuid = result.id

  // add the data to userAccounts collection
  await db.collection('userAccounts').doc(uuid).set({ uuid: uuid, apiKey:apiKey, lastValid: new Date().toISOString(), freeToPlay:freeToPlay, id: result.name, volunteer: false }).catch(err => console.log(err))

  await db.collection('participants').doc(user).set({ uuid: uuid }, {merge: true}).catch(err => console.log(err))

  // return that is is a success
  return {success: "API key added"}
})

const updateApiKeyNote = functions.https.onCall(async({user,note}, context) => {
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  // add the data to yearly participation data collection
  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).set({ note: note }, {merge: true}).then(()=> {return true}).catch(() => {return false});
  if(entryResult){
    return {success: "Note added"}
  }else{
    return {error: "Error adding note"}
  }
})

const assignedGiftees = functions.https.onCall(async ({user}, context) => {
  let gifter_uuid = await getUUID(user)
  if(gifter_uuid.error){return {error: "no API key set"}}
  gifter_uuid = gifter_uuid.success

  let giftee = await db.collection('events').doc(EVENT).collection('participants').where('gifter', '==', gifter_uuid).get()
  if (giftee.empty) {return {error: "No valid users"}}

  // array in case the user is sending gifts to multiple folks
  let gifteeArray = []
  giftee.forEach(doc => {
    let gifteeData = doc.data()
    gifteeArray.push({
      name:gifteeData.name,
      note:gifteeData.note,
      // used to identify the user
      uuid:gifteeData.participant,
      // these note the state
      sent: gifteeData.sent,
      received: gifteeData.received,
      reported: gifteeData.reported,
    })
  })

  return { success:gifteeArray }
})

const volunteer = functions.https.onCall(async({user,count}, context) =>{
  return await volunteerForNewGiftees(user, count)
})

module.exports = { updateApiKey, updateApiKeyNote, assignedGiftees, volunteer }