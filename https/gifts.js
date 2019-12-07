/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require('firebase-functions');
require('firebase/firestore');
const { getUUID, markGifteeAccount } = require('../utils/utils');
const { EVENT } = require("../config/constants");
const db = require('../config/db');

/**
 * @namespace sendGift
 * @return {sendGift~inner} - the returned function
 */
const sendGift = functions.https.onCall(
  /**
   * marks the gift sent on boith the gifter and giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {bool} data.value - marks it either true or false
   * @param {string} data.giftee_uuid - UUID of the giftee, if you do not know it
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async({user, value, giftee_uuid}, context) => {
  // this has to mark both the giftee and gifter

  if(!giftee_uuid){return {error: "no giftee_uuid set"}}

  if(typeof value === "undefined"){value = true}
  // gifter first
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid.success).set({ sent_own: value }, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // giftee now, the giftee's uuid is known
  let gifteeStatus = await markGifteeAccount({uuid:giftee_uuid}, { field: "sent", value:value })

  // check result and return to frontend
  if(entryResult && gifteeStatus.success){
    return {success: "Successfully marked sent"}
  }else{
    return {error: "Error in marking sent" + gifteeStatus}
  }

})

/**
 * @namespace receiveGift
 * @return {receiveGift~inner} - the returned function
 */
const receiveGift = functions.https.onCall(
  /**
   * marks the gift recieved on the giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {bool} data.value - marks it either true or false
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({user, value}, context) => {
  // on the giftee (current user)
  let gifteeStatus = await markGifteeAccount({user:user},{ field: "received", value:value } )

  // check result and return to frontend
  if(gifteeStatus.success){
    return {success: gifteeStatus.success}
  }else{
    return {error: gifteeStatus.error}
  }
})

/**
 * @namespace reportGift
 * @return {reportGift~inner} - the returned function
 */
const reportGift = functions.https.onCall(
  /**
   * marks the gift reported on the giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {bool} data.value - marks it either true or false
   * @param {string} [data.message] - message for reporting
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async({user, value, message}, context) => {
  // on the giftee (current user)
  let gifteeStatus = await markGifteeAccount({user:user}, { field: "received", value:value, message:message })

  // check result and return to frontend
  if(gifteeStatus.success){
    return {success: gifteeStatus.success}
  }else{
    return {error: gifteeStatus.error}
  }
})

module.exports = { sendGift, receiveGift, reportGift }