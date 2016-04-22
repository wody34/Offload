/**
 * ServiceController
 *
 * @description :: Server-side logic for managing services
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var util = require('util')
var exec = require('child_process').exec;
var fs = require('fs')

module.exports = {
  normalize: function (req, res) {
    var param = JSON.stringify(req.body)
    if(_.isUndefined(fs.writeFileSync(param.filename, param.data)))
      res.json({})

    console.log()
    var child = exec("blindmotion/data_prepaire/Normalizer ", function (error, stdout, stderr) {
      util.print('stdout: ' + stdout);
      util.print('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      res.json({data: stdout})
    });

  },
  modifier: function (req, res) {

  },
  prepaire: function (req, res) {

  },
  post_prepaire: function (req, res) {

  },
  train: function (req, res) {

  },
  generate_event: function (req, res) {

  },
  prepaire_events: function (req, res) {

  },
  predict_events: function (req, res) {

  },
  post_process_events: function (req, res) {

  },
  compaire_events: function (req, res) {

  }
};

