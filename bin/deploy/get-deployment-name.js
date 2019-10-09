const fs = require('fs');
const path = require('path');

console.log(path.relative(process.cwd(), '/home/pavel-l-fox/work/_learn/jenkins/lambda-deploy/bin/deploy/utils.js').toString());

try {
  const packageJson = JSON.parse(fs.readFileSync(`${process.argv[2]}/package.json`).toString());
  const { deploy, version } = packageJson;
  console.log(`${deploy.serviceName}-${version}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
