/* eslint no-console: ["off"] */

const omitby = require('lodash.omitby');
const {sh} = require('../packages/deployer/source/util');
const fs = require('fs');

const prefixToExclude = '@foxdcg/';
const report = {
  totalVulnerabilities: {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  },
  packages: {},
};

const log = (...args) => console.log(...args);

const main = async () => {
  const output = await sh('lerna exec -- pwd');
  const locations = output.split('\n');
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i].replace('/packages', '/packages_audit');
    const packFile = fs.readFileSync(`${location}/package.json`, 'utf-8');
    const pack = JSON.parse(packFile);
    pack.dependencies = pack.dependencies && omitby(pack.dependencies, (v, k) => k.startsWith(prefixToExclude));
    pack.devDependencies = pack.devDependencies && omitby(pack.devDependencies, (v, k) => k.startsWith(prefixToExclude));
    fs.writeFileSync(`${location}/package.json`, JSON.stringify(pack, null, 2), 'utf-8');

    log(`Checking ${location}...`);
    await sh('rm -f package-lock.json', {cwd: location});
    await sh('npm i --package-lock-only', {cwd: location});
    await sh('npm audit --json > report.json', {allowError: true, cwd: location});

    const packageReportFile = fs.readFileSync(`${location}/report.json`, 'utf-8');
    if (packageReportFile) {
      const packageReport = JSON.parse(packageReportFile);

      const packageReportKey = location.split('/packages_audit')[1].substring(1);
      // store only failed reports and reports with vulnerabilities
      if (packageReport.metadata) {
        const {
          info,
          low,
          moderate,
          high,
          critical,
        } = packageReport.metadata.vulnerabilities;
        report.totalVulnerabilities.info += info;
        report.totalVulnerabilities.low += low;
        report.totalVulnerabilities.moderate += moderate;
        report.totalVulnerabilities.high += high;
        report.totalVulnerabilities.critical += critical;

        if (info + low + moderate + high + critical > 0) {
          report.packages[packageReportKey] = packageReport;
        }
      } else {
        report.packages[packageReportKey] = packageReport;
      }
    }
  }

  log(JSON.stringify(report, null, 2));
  fs.writeFileSync('./packages_audit/report.json', JSON.stringify(report, null, 2), 'utf-8');

  // do not consider info layer as an error
  const {
    low,
    moderate,
    high,
    critical,
  } = report.totalVulnerabilities;
  const vulnerabilitiesCount = low + moderate + high + critical;
  if (vulnerabilitiesCount) {
    log(`Found ${vulnerabilitiesCount} vulnerabilities`);
    process.exit(1);
  }
};

main().catch(console.error);
