import { test } from "node:test";
import assert from "node:assert/strict";
import { getMyMatchingControl } from "../components/TwoWeeksProposal/myPageModel.mjs";
const member = (changes = {}) => ({ status: "approved", reviewStatus: "approved", matchingStatus: "not_started", nextRoundStatus: "ready", ...changes });
test("ready member can pause", () => assert.deepEqual([getMyMatchingControl(member()).active, getMyMatchingControl(member()).action], [true, "pause"]));
test("user paused member can resume", () => assert.deepEqual([getMyMatchingControl(member({matchingStatus:"paused",nextRoundStatus:"user_paused"})).active,getMyMatchingControl(member({matchingStatus:"paused",nextRoundStatus:"user_paused"})).action],[false,"resume"]));
test("active proposal locks matching toggle", () => assert.equal(getMyMatchingControl(member({matchingStatus:"proposed",currentProposal:{status:"proposed"}})).action,""));
test("confirmed meeting locks toggle", () => assert.equal(getMyMatchingControl(member({matchingStatus:"confirmed"})).action,""));
test("admin hold cannot become a user pause", () => assert.equal(getMyMatchingControl(member({matchingStatus:"paused",nextRoundStatus:"admin_hold"})).action,""));
test("withdrawn member cannot resume", () => assert.equal(getMyMatchingControl(member({status:"withdrawn",matchingStatus:"paused",nextRoundStatus:"user_paused"})).action,""));
test("profile review pending prevents toggles", () => assert.equal(getMyMatchingControl(member({reviewStatus:"reviewing"})).action,""));
test("contact connected can resume only without live match", () => assert.equal(getMyMatchingControl(member({matchingStatus:"paused",nextRoundStatus:"contact_connected"})).action,"resume"));

test("completed previous meeting, next round ready shows enabled", () => assert.deepEqual([getMyMatchingControl(member({matchingStatus:"completed"})).active,getMyMatchingControl(member({matchingStatus:"completed"})).action],[true,"pause"]));
test("stale current proposal blocks UI consistent with server", () => {const state=getMyMatchingControl(member({matchingStatus:"completed",currentProposal:{matchId:"stale"}}));assert.equal(state.action,"");assert.match(state.reason,/운영자/);});
test("missing application loading is safe",()=>assert.equal(getMyMatchingControl(null).action,""));
