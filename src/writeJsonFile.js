const fs = require('fs-extra');

const writeToFile = object => {
  let newObject = {
    key: new Date().getTime(),
    date: new Date(),
    data: object
  };
  let fileName = newObject.key.toString();
  console.log('Saving ' + fileName + ' to /files directory.');
  let newJsonObject = JSON.stringify(newObject, null, 2);
  fs.writeFileSync('../files/' + fileName + '.json', newJsonObject);
};

module.exports = {
  writeToFile: writeToFile
};
