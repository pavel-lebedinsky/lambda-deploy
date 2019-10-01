// replaces package.json dependencies from "^1.0.0" to relative "file:../" protocols
// it removes lerna magic from package.json-s and allows yarn install

const { sh } = require('../packages/deployer/source/util');
const fs = require('fs');
const path = require('path');

(async () => {
  const packages = (await sh('lerna exec -- pwd'))
    .split('\n')
    .map(location => {
      location = location.replace('/packages', '/packages_deploy');
      const packFile = fs.readFileSync(`${location}/package.json`, 'utf-8');
      const pack = JSON.parse(packFile);
      return {
        name: pack.name,
        location,
        json: pack,
      };
    });
  packages.forEach(pack => {
    let hasChanged = false;
    packages.forEach(dep => {
      if (pack.json.dependencies && pack.json.dependencies[dep.name]) {
        const relativeDep = path.relative(pack.location, dep.location);
        pack.json.dependencies[dep.name] = `file:${relativeDep}`;
        hasChanged = true;
      }
    });
    if (hasChanged) {
      fs.writeFileSync(`${pack.location}/package.json`, JSON.stringify(pack.json, null, 2));
    }
  });
})();
