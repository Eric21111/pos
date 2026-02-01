const dbManager = require('./config/databaseManager');
const fs = require('fs');
const util = require('util');

const logFile = fs.createWriteStream('test-log.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function testManager() {
    console.log('Starting Database Manager Test...');
    try {
        await dbManager.initialize();
        console.log('Initialization complete.');
        console.log('Current Mode:', dbManager.getCurrentMode());

        // Keep alive for a bit to see if monitoring kicks in (though we set it to 30s)
        setTimeout(async () => {
            await dbManager.disconnect();
            console.log('Test finished.');
        }, 5000);
    } catch (error) {
        console.error('Test failed:', error);
        logFile.write('Test failed: ' + util.format(error) + '\n');
    }
}

testManager();
