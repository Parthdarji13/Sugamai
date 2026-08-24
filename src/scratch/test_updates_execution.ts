import { fetchLiveGovernmentUpdates } from '../retrieval/updateFetcher';
import { governmentUpdates } from '../retrieval/updatesData';

async function testUpdates() {
  console.log('====================================================');
  console.log(' TESTING LIVE PIB UPDATES & FALLBACK PIPELINE');
  console.log('====================================================\n');

  console.log('1. Executing fetchLiveGovernmentUpdates()...');
  const liveResult = await fetchLiveGovernmentUpdates();

  if (liveResult) {
    console.log(`\nLIVE FETCH SUCCESS! Received ${liveResult.length} items:\n`);
    liveResult.forEach((item, idx) => {
      console.log(`[Item ${idx + 1}]`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Title (EN): "${item.title.en}"`);
      console.log(`  Title (HI): "${item.title.hi}"`);
      console.log(`  Date: ${item.date}`);
      console.log(`  Source URL: ${item.sourceUrl}`);
      console.log(`  Department: ${item.department.en}`);
      console.log(`  Category: ${item.category}`);
      console.log('----------------------------------------------------');
    });
  } else {
    console.log('\nLIVE FETCH FAILED OR RETURNED < 3 ITEMS.');
    console.log('Static Fallback would be served:\n');
    governmentUpdates.forEach((item, idx) => {
      console.log(`[Fallback Item ${idx + 1}] ${item.title.en} (${item.sourceUrl})`);
    });
  }

  console.log('\n====================================================');
  console.log(' UPDATES PIPELINE VERIFICATION COMPLETE');
  console.log('====================================================');
}

testUpdates().catch(console.error);
