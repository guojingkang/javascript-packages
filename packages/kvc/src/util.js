

exports.a2p = function (fn, _this) {
  return function () {
    const args = Array.prototype.map.call(arguments, arg => arg);
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) return reject(err);
        else return resolve(data);
      });
      fn.apply(_this, args);
    });
  };
};

exports.wild2re = function (wild) {
  wild = wild.replace(/[\*\\\?\+\-\[\]\(\)\.,'"\^\$]/g, ($0) => {
    if ($0 === '*') return '.*';
    else return `\\${$0}`;
  });
  return new RegExp(`^${wild}$`);
};

exports.uniqueConcat = function (arr1, arr2) {
  const result = [];
  const len = arguments.length;
  for (let ii = 0; ii < len; ++ii) {
    const source = arguments[ii];
    for (let jj = source.length - 1; jj >= 0; --jj) {
      const item = source[jj];
      if (result.indexOf(item) < 0) result.push(item);
    }
  }
  return result;
};

exports.parseMGet = exports.parseDel = function (keys) {
  if (Array.isArray(keys)) return [keys];
  return [Array.prototype.slice.apply(arguments)];
};

exports.parseGet = function (key) {
  if (arguments.length > 1) throw new Error('get accept only one parameter');
  if (typeof key !== 'string') throw new Error('get accept only string key');
  if (!key) throw new Error('get need one string key');
  return [key];
};
