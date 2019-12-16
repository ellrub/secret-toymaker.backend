const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This manages initializing, sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require("firebase-functions");
require("firebase/firestore");
const { getGameAccountUUID } = require("../utils/utils");
const { EVENT } = require("../config/constants");
const db = require("../config/db");

/**
 * @namespace updateGiftSentStatus
 * @return {updateGiftSentStatus~inner} - the returned function
 */
const updateGiftSentStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isSent - if the gift is sent
   * @returns {Result}
   */
  async ({ user, giftId, isSent }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);

    let gift = await giftDoc.get();

    if (!gift.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          sent: isSent ? new Date().toISOString() : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's sent status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsSent: admin.firestore.FieldValue.increment(isSent ? 1 : -1)
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isStatsUpdated
      ? { success: "Successfully updated gift's sent status." }
      : {
          error: "Failed updating statistics."
        };
  }
);

/**
 * @namespace updateGiftReceivedStatus
 * @return {updateGiftReceivedStatus~inner} - the returned function
 */
const updateGiftReceivedStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isReceived - if the gift is received
   * @returns {Result}
   */
  async ({ user, giftId, isReceived }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);
    let gift = await giftDoc.get();

    if (!gift.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          received: isReceived ? new Date().toISOString() : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's received status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsReceived: admin.firestore.FieldValue.increment(
            isReceived ? 1 : -1
          )
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully && isStatsUpdated
      ? { success: "Successfully updated gift's received status." }
      : { error: "Failed updating statistics." };
  }
);

/**
 * @namespace updateGiftReportedStatus
 * @return {updateGiftReportedStatus~inner} - the returned function
 */
const updateGiftReportedStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isReporting - if the gift is being reported
   * @param {string} data.reportMessage - reason for reporting
   * @returns {Result}
   */
  async ({ user, giftId, isReporting, reportMessage }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);
    let gift = await giftDoc.get();

    if (!gift.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          reported: isReporting ? new Date().toISOString() : null,
          reportMessage: isReporting ? reportMessage : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's reported status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsReported: admin.firestore.FieldValue.increment(
            isReporting ? 1 : -1
          )
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully && isStatsUpdated
      ? { success: "Successfully updated gift's reported status." }
      : { error: "Failed updating statistics." };
  }
);

/**
 * @namespace getGifts
 * @return {getGifts~inner} - the returned function
 */
const getGifts = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @returns {Result}
   */
  async ({ user }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let incomingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("giftee", "==", gameAccountUUID)
      .get();

    let outgoingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("toymaker", "==", gameAccountUUID)
      .get();

    let incomingGifts = [];
    let outgoingGifts = [];

    if (!incomingGiftsSnapshot.empty) {
      incomingGiftsSnapshot.forEach(doc => {
        let data = doc.data();
        incomingGifts.push(data);
      });
    }

    if (!outgoingGiftsSnapshot.empty) {
      outgoingGiftsSnapshot.forEach(doc => {
        let data = doc.data();
        outgoingGifts.push(data);
      });
    }

    return {
      success: {
        outgoing: outgoingGifts,
        incoming: incomingGifts
      }
    };
  }
);

module.exports = {
  getGifts,
  updateGiftSentStatus,
  updateGiftReceivedStatus,
  updateGiftReportedStatus
};
