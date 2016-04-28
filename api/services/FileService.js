
var fs = require('fs')

module.exports = {
  upload: function  (req, names, cb) {
    // if (!_.isUndefined(req.body[names[0]])) {
      async.map(names, function(name, async_cb) {
        var file = {fd: ".tmp/uploads/{0}".format(req.body[name+'name']), name: req.body[name+'name']};
        var data = req.body[name]
        fs.writeFile(file.fd, data, function(err) {
          async_cb(err, file);
        });
      }, function(err, results) {
        cb(err, results, false);
      });
    // }
    // else {  //TODO: 다중 파일 업로드 수정
    //   req.file(names).upload({maxBytes: 1000000000}, function (err, files) {
    //     return cb(err, files, true)
    //   });
    // }
  },
  download: function (res, files, isFile) {
    console.log(files)
    if(!isFile) {
      fs.readFile(files[0].fd, 'utf8', function (err, data) {
        console.log(files[0].name);
        res.json({file1: data, file1name: files[0].name});
      });
    }
    else {
      res.sendfile(files[0].fd);
    }
  }
};
