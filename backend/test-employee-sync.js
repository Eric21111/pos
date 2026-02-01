const dataSyncService = require('./services/dataSyncService');
const mongoose = require('mongoose');

async function testEmployeeSync() {
    console.log('Starting Employee Sync Test...');
    try {
        // We only want to test Employee sync, but the service syncs everything.
        // That's fine, we just want to see the logs.
        await dataSyncService.sync();
        console.log('Employee Sync Test Finished.');
    } catch (error) {
        console.error('Employee Sync Test Failed:', error);
    } finally {
        process.exit(0);
    }
}

testEmployeeSync();
