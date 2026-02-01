const dns = require('dns').promises;

async function testDNS() {
    console.log('Testing DNS resolution for google.com...');
    try {
        const addresses = await dns.resolve('google.com');
        console.log('DNS Resolution Successful:', addresses);
    } catch (error) {
        console.error('DNS Resolution Failed:', error.message);
    }
}

testDNS();
