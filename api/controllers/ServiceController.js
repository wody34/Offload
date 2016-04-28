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
  index: function (req,res){

    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
      '<form action="/service/normalizer" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="file1" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    )
  },


  normalizer: function (req, res) {
    FileService.upload(req, ['file1', 'file2'], function(err, files, isFile) {
      console.log(files, isFile);
      console.log("blindmotion/data_prepaire/Normalizer -output {0} {1}".format(files[0].fd+'.norm', files[0].fd))
      if(err)
        res.error(err)
      var output_file = {fd: files[0].fd+'.norm', name: files[0].fd+'.'}
      var child = exec("blindmotion/data_prepaire/Normalizer -output {0} {1}".format(files[0].fd+'.norm', files[0].fd), function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          res.error(error)
        }
        FileService.download(res, [{fd: files[0].fd+'.norm', name: files[0].name+'.norm'}], isFile);
      });
    })
  },
  modifier: function (req, res) {
    FileService.upload(req, ['file1'], function(err, files, isFile) {
      console.log(files, isFile);
      console.log("coffee blindmotion/data_prepaire/modifier.coffee --input {0} --output {1} --modifier blindmotion/data_prepaire/smooth.coffee".format(files[0].fd, files[0].fd+'smooth'));
      if(err)
        res.error(err)
      var child = exec("coffee blindmotion/data_prepaire/modifier.coffee --input {0} --output {1} --modifier blindmotion/data_prepaire/smooth.coffee".format(files[0].fd, files[0].fd+'smooth'), function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          res.error(error)
        }
        FileService.download(res, [{fd: files[0].fd+'.smooth', name: files[0].name+'.smooth'}], isFile);
      });
    });
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

