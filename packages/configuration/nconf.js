/* istanbul ignore file */
const nconf = require('nconf');
const appRoot = require('app-root-path');
const { getSSMParameter } = require('./ssm');

nconf
  .argv()
  .env({
    // trim values before usage
    transform: (obj) => {
      if (typeof obj.value !== 'string') {
        return false;
      }
      obj.value = obj.value.trim();
      return obj;
    },
  });

const appEnv = (nconf.get('APP_ENV') || 'local').trim();


// fallbacks: service-env -> service-defaults -> shared-env -> shared defaults
nconf.file('service-env', `${appRoot}/config/${appEnv}.env.json`);
nconf.file('service-defaults', `${appRoot}/config/default.env.json`);
nconf.file('shared-env', `${__dirname}/config/${appEnv}.env.json`);
nconf.file('shared-defaults', `${__dirname}/config/default.env.json`);

nconf.ssm = getSSMParameter.bind(nconf);

module.exports = nconf;
