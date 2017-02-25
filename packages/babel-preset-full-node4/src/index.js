
const presetEs2015 = require('babel-preset-es2015-node4');
const presetEs2016 = require('babel-preset-es2016');
const presetEs2017 = require('babel-preset-es2017');
const presetStage0 = require('babel-preset-stage-0');

module.exports = function preset(context, options) {
  return {
    presets: [
      presetEs2015,
      presetEs2016,
      presetEs2017,
      presetStage0,
    ],
  };
};

