const { execPromise } = require('./utils');

const argv = require('yargs')
  .scriptName('deploy-discover')
  .options({
    'f': {
      alias: 'force',
      describe: 'pass "true" to not take changed packages in account',
      type: 'boolean',
      demand: true,
      default: false
    },
    'p': {
      alias: 'packages',
      describe: 'space separated list of the packages to deploy. Pass "all" if there are ' +
        'no specific packages list all deployable packages should be found',
      type: 'array',
      demand: true
    }
  })
  .argv;

async function getPackages() {
  const output = await execPromise('lerna list -a --json');
  return JSON.parse(output);
}

async function getChangedPackages() {
  try {
    const output = await execPromise('lerna changed -a --json');
    return JSON.parse(output);
  } catch (err) {
    console.warn('No changed packages detected');
  }
  return [];
}

async function main() {
  const requestedPackages = argv.packages;
  const isAll = requestedPackages[0] === 'all';
  const allPackages = await getPackages();

  let packagesToDeploy = isAll
    ? allPackages
    : allPackages.filter(item => requestedPackages.includes(item.name));

  if (!argv.force) {
    const changedPackagesNames = (await getChangedPackages()).map(item => item.name);
    packagesToDeploy = packagesToDeploy.filter(item => changedPackagesNames.includes(item.name));
  }

  console.log(packagesToDeploy.map(item => item.name).join('\n'));
}

main().catch(console.error);