const { exec, execFile } = require('child_process');

const defaultOpts = { maxBuffer: Number.POSITIVE_INFINITY };

const execPromise = (command, opts = {}) =>
  new Promise((resolve, reject) =>
    exec(command, { ...defaultOpts, ...opts }, (error, stdout, stderr) =>
      (error ?
          reject(Object.assign(error, { stdout, stderr })) :
          resolve(stdout.trim())
      )));

const execFilePromise = (command, args = [], opts = {}) =>
  new Promise((resolve, reject) =>
    execFile(command, args, { ...defaultOpts, ...opts }, (error, stdout, stderr) =>
      (error ?
          reject(Object.assign(error, { stdout, stderr })) :
          resolve(stdout.trim())
      )));

module.exports = {
  execPromise,
  execFilePromise,
};
