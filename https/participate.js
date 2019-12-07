/*
This is for when folks decide to participate, sets up the required values
*/
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { EVENT } = require("../config/constants");
const db = require('../config/db');
const { getGw2Account, getUUID } = require('../utils/utils');

const participate = functions.https.onCall(async ({user, participate}, context) => {
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  if(!participate){
    // user wishes to undo their participation

    let deleteDoc =  await db.collection('events').doc(EVENT).collection('participants').doc(uuid).delete().then(()=> {return true}).catch(() => {return false})
    let entryResult2 = await db.collection('events').doc(EVENT).set({participants: admin.firestore.FieldValue.increment(-1)}, {merge: true}).then(()=> {return true}).catch(() => {return false});
    if(deleteDoc && entryResult2){
      return {success: "Successfully removed"}
    }else{
      return {error: "Error removing participant"}
    }
  }

  let gameAccount = await getGw2Account(uuid)

  // use uuid to set teh game accoutn for entry
  let entry = {
    participant: uuid,
    entered: new Date().toISOString(),

    // this marks if they have sent their own gift
    sent_own: false,

    // these manage the status of this persons gift
    sent:false,
    received: false,
    reported: false,

    // these manage who is gifting to them and who they are gifting to
    giftee: null,
    gifter: null,

    // add this here, will save a call later
    name:gameAccount.success.id,
    // mark if the account is F2P
    freeToPlay:gameAccount.success.freeToPlay
  }
  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).set(entry).then(()=> {return true}).catch(() => {return false});
  let entryResult2 = await db.collection('events').doc(EVENT).set({participants: admin.firestore.FieldValue.increment(1)}, {merge: true}).then(()=> {return true}).catch(() => {return false});
  // check result and return to frontend
  if(entryResult && entryResult2){
    return {success: "Successfully added"}
  }else{
    return {error: "Error entering participant"}
  }
})

module.exports = { participate }