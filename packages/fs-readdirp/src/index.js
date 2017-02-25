(function () {
  const path = require('path');
  const fs = require('fs');

  function readdirpSync(dir, filter) {
    let ret = [];
    if (!fs.existsSync(dir)) return ret;

    const files = fs.readdirSync(dir);
    for (const i in files) {
      const filePath = path.join(dir, files[i]);
      const stats = fs.lstatSync(filePath);

      if (filter) {
        const filterRet = filter(filePath, stats);
        if (filterRet !== false) ret.push(filterRet);
      } else ret.push(filePath);

      if (stats.isDirectory()) {
        ret = ret.concat(readdirpSync(filePath, filter));
      }
    }
    return ret;
  }

  module.exports.readdirpSync = readdirpSync;

  function readdirp(dir, filter, done) {
    let ret = [];

    fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      let pending = list.length,
        hasError = false;
      if (!pending) return done(null, ret);

      function wrong(err) {
        if (!hasError) {
          hasError = true;
          done(err);
        }
      }

      function got(filePath, stats, filterRet) {
        if (filterRet !== false) ret.push(filterRet);

        if (stats && stats.isDirectory()) {
          readdirp(filePath, filter, (err, res) => {
            res && (ret = ret.concat(res));
            if (!--pending) done(null, ret);
          });
        } else if (!--pending) return done(null, ret);
      }

      list.forEach((file) => {
        const filePath = path.resolve(dir, file);
        fs.lstat(filePath, (err, stats) => {
          if (filter) {
            if (filter.length === 3) { // with callback
              filter(filePath, stats, (err, filterRet) => {
                if (err) return wrong(err);
                got(filePath, stats, filterRet);
              });
            } else {
              try {
                const filterRet = filter(filePath, stats);
                got(filePath, stats, filterRet);
              } catch (e) {
                return wrong(e);
              }
            }
          } else {
            got(filePath, stats, filePath);
          }
        });
      });
    });
  }

  module.exports.readdirp = readdirp;
}());
