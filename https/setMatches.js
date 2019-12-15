const functions = require("firebase-functions");
const { matchAllParticipants } = require("../utils/matchAllParticipants");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");

// TODO: set this up to run on a schedule
/*

// this is to run a script on a schedule
export scheduledFunctionCrontab =
functions.pubsub.schedule('5 * * * *').onRun((context) => {
    console.log('This will be run every day at 00:05 AM UTC!');
});

// get the current stage
// if the current stage is not signup - continue
// check if this has already run// if not it runs the subfunctions below
// matchAllParticipants

 */

module.exports = functions.https.onCall(async (blank, context) => {
  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

  if (!eventDoc.exists) {
    return { error: "Event does not exist" };
  }

  const event = await eventDoc.get();
  const { isMatchingDone } = event.data();

  if (isMatchingDone) {
    return { error: "Matching for event is already done." };
  }

  const matchingResults = await matchAllParticipants();

  if (matchingResults.success) {
    await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .set({ isMatchingDone: true }, { merge: true });

    return { success: "Matching for the event done." };
  }

  return { error: "Matching for the event failed." };
});
