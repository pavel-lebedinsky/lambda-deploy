const { execPromise } = require('./utils');

async function main() {
  const packagePath = process.argv[2];
  const serviceName = packagePath.replace('packages/', '');
  const zipName = `${packagePath.split('/').pop()}.zip`;

  await execPromise(`yarn zip ${serviceName} ${zipName}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});