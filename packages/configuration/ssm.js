const AWS = require('aws-sdk');

function getSSMParameter(name, withDecryption = true) {
  const ssm = new AWS.SSM();

  const opts = {
    Name: name,
    WithDecryption: withDecryption,
  };

  return () => ssm.getParameter(opts).promise()
    .then(({ Parameter }) => Parameter)
    .then(({ Value }) => Value);
}

function putSSMParameter(name, value) {
  const ssm = new AWS.SSM();

  const opts = {
    Name: name,
    Type: 'String',
    Value: value,
    Overwrite: true,
  };

  return ssm.putParameter(opts).promise();
}


module.exports = {
  getSSMParameter,
  putSSMParameter,
};
