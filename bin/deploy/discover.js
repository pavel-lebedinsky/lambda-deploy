const fs = require('fs');
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

async function getDeployablePackages() {
  const output = await execPromise('lerna exec -- pwd');
  return output.split('\n')
    .reduce((result, packagePath) => {
      const packageJson = JSON.parse(fs.readFileSync(`${packagePath}/package.json`).toString());
      if (packageJson.deploy) {
        result.push({ serviceName: packageJson.deploy.serviceName, packagePath });
      }
      return result;
    }, []);
}

async function getChangedPackages() {
  let result = [];
  try {
    const output = await execPromise('lerna changed -a -p');
    result = output.split('\n');
  } catch (err) {
    console.warn('No changes detected.');
  }
  return result;
}

async function main() {
  let packagesToDeploy = [];
  const requestedPackages = argv.packages;
  const isAll = requestedPackages[0] === 'all';
  const allPackagesList = await getDeployablePackages();

  if (argv.force) {
    packagesToDeploy = isAll
      ? allPackagesList
      : allPackagesList.filter(item => requestedPackages.includes(item.serviceName));
  } else {
    const changedPackagesPaths = await getChangedPackages();
    packagesToDeploy = isAll
      ? allPackagesList.filter(item => changedPackagesPaths.includes(item.packagePath))
      : allPackagesList.filter(item =>
          changedPackagesPaths.includes(item.packagePath) && requestedPackages.includes(item.serviceName));
  }

  console.log(packagesToDeploy.map(item => item.packagePath).join('\n'));
}

main().catch(console.error);