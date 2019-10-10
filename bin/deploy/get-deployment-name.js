const fs = require('fs');

try {
  const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/${process.argv[2]}/package.json`).toString());
  const { deploy, version } = packageJson;
  console.log(`${deploy.serviceName}-${version}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
