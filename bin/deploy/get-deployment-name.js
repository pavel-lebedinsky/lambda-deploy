const { execPromise } = require('./utils');

async function main() {
  try {
    const output = await execPromise(`lerna list -a --json --scope=${process.argv[2]}`);
    const { name, version } = JSON.parse(output)[0];
    console.log(`${name}_${version}`);
  } catch (err) {
    console.error(`Can not find package "${process.argv[2]}"`);
    process.exit(1);
  }
}

main().catch(console.error);
