const { execPromise } = require('./utils');

async function main() {
  await execPromise('lerna version patch --yes');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});