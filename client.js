var fs = require('fs');
var request = require('request');


var file1 = {text: fs.readFileSync('/Users/SeongHwanKim/blindmotion/sensors/2014-09-17_SensorDatafile.csv', 'utf8'), name: '2014-09-17_SensorDatafile.csv'};
var outTrain = {text: fs.readFileSync('/Users/SeongHwanKim/blindmotion/training/out-2014-09-17.csv', 'utf8'), name: 'out-2014-09-17.csv'};
console.log('load ended')
offload(request({method:'post', url:'http://localhost:1338/service/normalizer', body:JSON.stringify({file1:file1.text, file1name:file1.name})}, function (normalizer_err, normalizer_res, normalizer_b) {
  console.log(normalizer_err, 'normalizer ended')
  var res_file = JSON.parse(normalizer_b)
  request({method:'post', url:'http://localhost:1338/service/modifier', body: JSON.stringify({file1:res_file.file1, file1name:res_file.file1name})}, function (err, res, b) {
    console.log(err, 'modifier ended')

    // request({method:'post', url:'http://localhost:1338/service/prepaire', body: JSON.stringify({file1:outTrain.text, file1name:outTrain.name})});
  })
});
