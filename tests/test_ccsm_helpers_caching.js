// test_ccsm_helpers_caching.js -- regression guard for the 2026-08-17
// Agent1B silent-failure investigation.
//
// Agent1B calls getMessageBank()/checkNoRepeat() up to ~6x per area (2
// lookups per each of up to 3 message slots: strength1, strength2, growth),
// and both used to re-run a full sheet.getRange(...).getValues() every call
// with zero caching -- an O(areas x slots) number of real Sheets round-trips
// against two small, static tabs (MESSAGE_BANK, FEEDBACK_HISTORY) that never
// change mid-run. Against the real ~43-area roster that's several hundred
// redundant reads, a plausible way to blow Apps Script's 6-minute execution
// cap -- which kills the whole execution at the platform level, bypassing
// runAgent1B()'s try/catch, so logRun() never runs and AGENT_RUN_LOG shows
// nothing at all (exactly what was observed live: Agent1A logged success and
// scheduled Agent1B, and Agent1B never logged anything, success or error).
//
// This test proves the call count no longer scales with area count
// (getTabDataCached_() in CCSM_Helpers.gs) by simulating a much larger pick
// volume than any single real Monday will ever need and asserting the
// underlying sheet reads stay flat.
const { makeGasEnv } = require('./gas_stubs');
const { loadGs } = require('./load_gs');
const { makeCcsmSpreadsheet } = require('./fixtures');
const assert = require('assert');

const env = makeGasEnv();
const scope = loadGs(
  ['CcsmData.gs', 'BuildCcsmSheet.gs', 'CCSM_Helpers.gs', 'CCSM_AgentTestMode.gs'],
  env.globals
);
const ss = makeCcsmSpreadsheet(env, scope);

// Seed MESSAGE_BANK: 5 metrics x 2 categories x 2 variants, so
// checkNoRepeat() has more than one candidate to filter per category+metric
// (closer to the real ~193-row bank than a single-row degenerate case).
const messageBank = ss.getSheetByName('MESSAGE_BANK');
const METRICS = ['contact_rate', 'mc_rate', 'lesson_rate', 'close_rate', 'effort_score'];
METRICS.forEach(function (metric) {
  ['SUNDAY_COACHING_STRENGTH', 'SUNDAY_COACHING_GROWTH'].forEach(function (category) {
    [1, 2].forEach(function (variant) {
      messageBank.appendRow([
        category.slice(0, 1) + '-' + metric.toUpperCase() + '-' + variant,
        category, metric, '',
        'Asunto ' + metric + ' ' + variant,
        'Cuerpo ' + metric + ' ' + variant,
        '100', 'Capitulo', 'Escritura 1:1', 'Texto de escritura', 'TRUE',
      ]);
    });
  });
});

// Seed FEEDBACK_HISTORY with a handful of pre-existing rows so
// checkNoRepeat() has real (non-empty) data to scan, not just an empty tab.
const feedbackHistory = ss.getSheetByName('FEEDBACK_HISTORY');
const cAreaId = scope.col_('FEEDBACK_HISTORY', 'Area_ID');
const cLastMsgId = scope.col_('FEEDBACK_HISTORY', 'Last_Message_ID');
for (let i = 0; i < 10; i++) {
  const row = new Array(feedbackHistory.getLastColumn() || cLastMsgId + 1).fill('');
  row[cAreaId] = 'A' + String(i).padStart(3, '0');
  row[cLastMsgId] = 'S-CONTACT_RATE-1';
  feedbackHistory.appendRow(row);
}

// ---------------------------------------------------------------------------
// Simulate Agent1B's real per-area call shape (a1b_pickAndAttach: one
// pickMessage() + one direct getMessageBank() per message slot) across many
// more areas than any real Monday run needs, to make an O(n) regression
// impossible to miss.
// ---------------------------------------------------------------------------
env.state.sheetReadCounts = {}; // reset after fixture setup, before measuring
const AREA_COUNT = 60;
const SLOTS = [
  ['SUNDAY_COACHING_STRENGTH', 'contact_rate'],
  ['SUNDAY_COACHING_STRENGTH', 'effort_score'],
  ['SUNDAY_COACHING_GROWTH', 'close_rate'],
];

for (let i = 0; i < AREA_COUNT; i++) {
  const areaKey = 'A' + String(i).padStart(3, '0');
  SLOTS.forEach(function (slot) {
    const messageId = scope.pickMessage(areaKey, slot[0], slot[1]);
    assert.ok(messageId, 'expected a message to be picked for ' + slot.join('/'));
    const candidates = scope.getMessageBank(slot[0], slot[1]);
    assert.ok(candidates.some(function (c) { return c.messageId === messageId; }));
  });
}

// 60 areas x 3 slots x (1 pickMessage + 1 direct getMessageBank) = 360
// logical lookups against each tab. Uncached, that is 360 real MESSAGE_BANK
// data reads and 180 real FEEDBACK_HISTORY data reads (checkNoRepeat runs
// once per candidate message per pickMessage call, not per direct
// getMessageBank call).
//
// Cached, each tab is read AT MOST twice total no matter how many
// areas/slots run: once for its header row (getHeaders_()'s own
// pre-existing cache, col_() -> getTabHeaders() -> getRange(1,...) --
// possibly already primed by the fixture setup above, hence "at most" not
// "exactly") and once for its data rows (getTabDataCached_() ->
// getTabData() -> getRange(2,...)). Both are real, necessary,
// already-cached reads of two different row ranges of the same sheet -- the
// invariant this test protects is that neither count scales with
// AREA_COUNT, which an uncached getMessageBank()/checkNoRepeat() blows past
// immediately (360 and 180 respectively at these volumes).
['MESSAGE_BANK', 'FEEDBACK_HISTORY'].forEach(function (tab) {
  const count = env.state.sheetReadCounts[tab];
  assert.ok(
    count >= 1 && count <= 2,
    tab + ' should be read from the sheet at most twice per execution (1 header + 1 data), was read ' +
      count + ' times -- getMessageBank()/checkNoRepeat() are not caching via getTabDataCached_()'
  );
});

console.log('ccsm_helpers_caching OK');
