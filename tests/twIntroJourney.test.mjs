import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

// Node without a bundler: load the pure UI state code with its relative ESM import resolved.
const root = new URL("../components/TwoWeeksProposal/", import.meta.url);
const lifecycle = readFileSync(new URL("proposalLifecycle.js", root), "utf8");
const lifecycleUrl = `data:text/javascript;base64,${Buffer.from(lifecycle).toString("base64")}`;
const source = readFileSync(new URL("introJourneyState.js", root), "utf8").replace('from "./proposalLifecycle"', `from "${lifecycleUrl}"`);
const { resolveIntroJourney, summaryPastMatch, getSeoulDay } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const now = Date.parse("2026-10-22T09:00:00+09:00");
const app = (more={}) => ({ id: "a", reviewStatus: "approved", matchingStatus: "proposed", currentProposal: { matchId: "m", response: "pending" }, ...more });
const match = (status="proposed", more={}) => ({ id: "m", status, maleApplicationId: "a", femaleApplicationId: "b", ...more });
const best = (status="proposed", more={}) => ({ match: match(status,more), candidate: {id: "b",basic:{}}, counterpartResponse: {response:"pending"} });
const resolve = (args={}) => resolveIntroJourney({ application:app(), bestMatch:best(), nowMs:now,...args });

const cases = [
  ["review pending", { application:app({reviewStatus:"reviewing",currentProposal:{}}),bestMatch:null }, "review"],
  ["awaiting candidate", { application:app({currentProposal:{}, matchingStatus:"not_started"}),bestMatch:null }, "waiting"],
  ["paused", { application:app({matchingStatus:"paused"}) }, "paused"],
  ["candidate", {}, "candidate"],
  ["accepted waiting", {responseStatus:"accepted"}, "accepted"],
  ["mutual accepted", {responseStatus:"accepted", bestMatch:{...best("mutualAccepted"),counterpartResponse:{response:"accepted"}}}, "mutual"],
  ["first schedule choice",{ responseStatus:"accepted",bestMatch:best("mutualAccepted",{scheduleStatus:"needs_first_choice",schedule:{status:"needs_first_choice",firstSelectorApplicationId:"a"}}),scheduleActionRequired:true,scheduleOpen:true},"schedule_action"],
  ["final schedule choice",{ responseStatus:"accepted",bestMatch:best("mutualAccepted",{scheduleStatus:"needs_final_choice",schedule:{status:"needs_final_choice",firstSelectorApplicationId:"b"}}),scheduleActionRequired:true,scheduleOpen:true},"schedule_action"],
  ["schedule waiting",{ responseStatus:"accepted",bestMatch:best("mutualAccepted",{scheduleStatus:"waiting_counterpart",schedule:{status:"waiting_counterpart",firstSelectorApplicationId:"a"}}),scheduleOpen:true},"schedule_wait"],
  ["confirmed future",{bestMatch:best("confirmed",{scheduleStatus:"confirmed",finalMeeting:{startAtClient:"2026-10-27T19:00:00+09:00"}}),scheduleOpen:true},"confirmed"],
  ["meeting tomorrow",{bestMatch:best("confirmed",{scheduleStatus:"confirmed",finalMeeting:{startAtClient:"2026-10-23T19:00:00+09:00"}}),scheduleOpen:true},"meeting_tomorrow"],
  ["meeting today",{bestMatch:best("confirmed",{scheduleStatus:"confirmed",finalMeeting:{startAtClient:"2026-10-22T19:00:00+09:00"}}),scheduleOpen:true},"meeting_day"],
  ["meeting in one hour",{bestMatch:best("confirmed",{scheduleStatus:"confirmed",finalMeeting:{startAtClient:"2026-10-22T10:00:00+09:00"}}),scheduleOpen:true},"meeting_soon"],
  ["expired",{proposalExpired:true},"expired"],
  ["declined",{bestMatch:best("declined")},"ended"],
  ["feedback ready",{ application:app({lastCompletedMatchId:"m"}),bestMatch:{match:match("completed")},feedbackReady:true },"feedback"],
  ["result ready",{ application:app({currentProposal:{},nextRoundStatus:"feedback_overdue"}),bestMatch:{match:match("completed")}},"result"],
  ["next round waiting",{ application:app({currentProposal:{},nextRoundStatus:"ready",matchingStatus:"not_started"}),bestMatch:{match:match("completed")}},"waiting"],
  ["topup requested",{application:app({currentProposal:{},deposit:{status:"topup_required"}}),bestMatch:null},"deposit"],
  ["completed candidate shouldn't appear",{application:app({currentProposal:{matchId:"m"}}),bestMatch:{match:match("completed"),candidate:null}},"result"],
];
for(const [name, args, expected] of cases) test(name,()=>assert.equal(resolve(args).phase,expected));
test("terminal beats confirmed",()=>assert.equal(resolve({bestMatch:best("cancelled",{scheduleStatus:"confirmed",finalMeeting:{startAtClient:"2026-10-22T19:00:00+09:00"}}),scheduleOpen:true}).phase,"ended"));
test("historical match summary without identity",()=>{const row=summaryPastMatch(match("declined", {createdAtClient:"2026-10-18T11:00:00+09:00"}),"a");assert.equal(row.label,"소개 종료");assert.deepEqual(Object.keys(row).sort(),["dateMs","id","label"]);});
test("no other person's history",()=>assert.equal(summaryPastMatch(match("declined"),"other"),null));
test("incomplete feedback not history",()=>assert.equal(summaryPastMatch(match("completed",{feedbackStatus:"partial"}),"a"),null));
test("Seoul date midnight",()=>assert.equal(getSeoulDay(Date.parse("2026-10-21T16:00:00Z")),getSeoulDay(Date.parse("2026-10-22T01:00:00+09:00"))));

test("null application after refresh is safe",()=>assert.equal(resolveIntroJourney({application:null}).phase,"loading"));
