const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

function cleanId(value = "") {
  return String(value || "").trim();
}

function getFinalMeeting(match = {}) {
  return match?.finalMeeting || match?.schedule?.finalMeeting || null;
}

function buildApplicationPatch(match = {}, applicationId = "") {
  const status = String(match?.status || "").trim();
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "").trim();
  const nowClient = new Date().toISOString();

  if (status === "declined") {
    const declinedByApplicationId = cleanId(
      match?.declinedByApplicationId || match?.decline?.declinedByApplicationId
    );
    const participantIds = [cleanId(match?.maleApplicationId), cleanId(match?.femaleApplicationId)].filter(Boolean);
    const candidateApplicationId = participantIds.find((id) => id !== applicationId) || "";
    const declinedByViewer = Boolean(declinedByApplicationId && declinedByApplicationId === applicationId);
    const declinedByCounterpart = Boolean(declinedByApplicationId && declinedByApplicationId !== applicationId);

    return {
      matchingStatus: "declined",
      "currentProposal.matchId": cleanId(match?.id),
      "currentProposal.candidateApplicationId": candidateApplicationId,
      "currentProposal.status": "declined",
      ...(declinedByViewer ? { "currentProposal.response": "declined" } : {}),
      ...(declinedByCounterpart
        ? {
            "currentProposal.counterpartResponse": "declined",
            "currentProposal.endedByCounterpart": true,
            "currentProposal.outcome": "counterpart_declined",
          }
        : {
            "currentProposal.endedByCounterpart": false,
            "currentProposal.outcome": declinedByViewer ? "self_declined" : "declined",
          }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  if (status === "mutualAccepted" || scheduleStatus === "waiting_counterpart") {
    return {
      matchingStatus: "mutualAccepted",
      "currentProposal.mutualAcceptedAt": match?.mutualAcceptedAt || admin.firestore.FieldValue.serverTimestamp(),
      "currentProposal.mutualAcceptedAtClient": match?.mutualAcceptedAtClient || nowClient,
      "schedule.status": scheduleStatus || "ready",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  if (status === "confirmed" || scheduleStatus === "confirmed") {
    const finalMeeting = getFinalMeeting(match);
    const confirmedAtClient =
      finalMeeting?.confirmedAtClient || match?.schedule?.confirmedAtClient || nowClient;

    return {
      matchingStatus: "confirmed",
      photoRevealStatus: "revealed",
      "currentProposal.photoRevealStatus": "revealed",
      "schedule.status": "confirmed",
      ...(finalMeeting ? { "schedule.finalMeeting": finalMeeting } : {}),
      "schedule.confirmedAt": match?.schedule?.confirmedAt || admin.firestore.FieldValue.serverTimestamp(),
      "schedule.confirmedAtClient": confirmedAtClient,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  return null;
}

function relevantStateSignature(match = {}) {
  return JSON.stringify({
    status: match?.status || "",
    proposalStatus: match?.proposalStatus || "",
    declinedByApplicationId:
      match?.declinedByApplicationId || match?.decline?.declinedByApplicationId || "",
    scheduleStatus: match?.scheduleStatus || match?.schedule?.status || "",
    finalMeetingStart:
      match?.finalMeeting?.startAtClient ||
      match?.schedule?.finalMeeting?.startAtClient ||
      "",
    finalMeetingConfirmed:
      match?.finalMeeting?.confirmedAtClient ||
      match?.schedule?.confirmedAtClient ||
      "",
  });
}

const syncTwoWeeksMatchParticipants = onDocumentWritten(
  {
    document: "twoweeksMatches/{matchId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const afterSnap = event.data?.after;
    if (!afterSnap?.exists) return;

    const after = { id: event.params.matchId, ...(afterSnap.data() || {}) };
    const before = event.data?.before?.exists ? event.data.before.data() || {} : {};

    if (event.data?.before?.exists && relevantStateSignature(before) === relevantStateSignature(after)) {
      return;
    }

    const applicationIds = Array.from(
      new Set([
        cleanId(after?.maleApplicationId),
        cleanId(after?.femaleApplicationId),
      ].filter(Boolean))
    );

    if (applicationIds.length !== 2) return;

    const db = admin.firestore();
    const applicationSnaps = await Promise.all(
      applicationIds.map((applicationId) =>
        db.collection("twoweeksApplications").doc(applicationId).get()
      )
    );
    const applicationsById = new Map(
      applicationSnaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, snap.data() || {}])
    );
    const batch = db.batch();
    let writeCount = 0;

    for (const applicationId of applicationIds) {
      const application = applicationsById.get(applicationId) || {};
      if (
        application.status === "withdrawn" ||
        application.withdrawal?.status === "completed"
      ) {
        continue;
      }
      const patch = buildApplicationPatch(after, applicationId);
      if (!patch) continue;
      const ref = db.collection("twoweeksApplications").doc(applicationId);
      batch.update(ref, patch);
      writeCount += 1;
    }

    if (!writeCount) return;
    await batch.commit();
  }
);

module.exports = { syncTwoWeeksMatchParticipants };
