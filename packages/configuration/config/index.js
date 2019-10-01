const nconf = require('../nconf');

const configuration = {
  test: {
    testKey: nconf.get('TEST_KEY') || 'default-test-value',
  },
  env: (nconf.get('APP_ENV') || 'local').trim(),
  aws: {
    region: nconf.get('AWS_REGION'),
  },
};

module.exports = configuration;
