

exports.createApp = createApp;
exports.createWxInstance = createWxInstance;


const tier = require('tier');
const fibext = require('fibext');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const WxInstance = require('../..');

function createApp() {
  const app = tier();
  app.use(tier.builtin.url());
  app.use(tier.builtin.send());
  app.use((req, resp, next) => {
    fibext.run(bodyParser.text({
      type: ['', 'text', 'text/html', 'text/xml'] }), req, resp);
    next();
  });
  return app;
}


const confFilePath = path.join(__dirname, '..', 'fixtures', 'params.json');
const content = fs.readFileSync(confFilePath, 'utf8');
const data = JSON.parse(content);

exports.openId = data.openId;
delete data.openId;
exports.templateMessageId = data.templateMessageId;
delete data.templateMessageId;

const certFilePath = path.join(__dirname, '..', 'fixtures', 'apiclient_cert.p12');
if (fs.existsSync(certFilePath)) {
  data.pfx = fs.readFileSync(certFilePath);
}
function createWxInstance(options) {
  let params = data;
  if (options) {
    params = {};
    for (const ki in data) params[ki] = data[ki];
    for (const kk in options) params[kk] = options[kk];
  }

  return new WxInstance(params);
}
