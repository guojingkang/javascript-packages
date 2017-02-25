'use strict';

var pd = require('peer-dep');
pd(module, 'fibext', {required: true});

module.exports = require('./lib/instance');