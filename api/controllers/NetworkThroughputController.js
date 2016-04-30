/**
 * NetworkThroughputController
 *
 * @description :: Server-side logic for managing Networkthroughputs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  getThroughput: function(req, res) {
    var mysql = require('mysql');
    var con = mysql.createConnection({
      host: "143.248.53.174",
      port: "33060",
      user: "kaist",
      password: "kaist",
      database: "broker_db"
    });

    var runid = 181;

    var throughput = {runid: runid, throughput:[]};
//and module like 'scenario.node[%].application';
    con.query("select * from broker_db.vector where runid="+runid+" and module like 'scenario.node[%].application';", function(err, rows) {
      if(err || _.isUndefined(rows) || rows.length === 0){
        return;
      }
      _.each(rows, function(row) {
        console.log(row.module + '-' + row.name);
      })

      var i = 0;
      async.whilst(
        function () { return i < rows.length; },
        function (callback) {
          var row = rows[i];
          var index = i;
          con.query('select * from vecdata where vectorid="' + row.id + '"', function (err, rows1) {
            console.log(i, row.module + '-' + row.name);
            var array = [];
            for(var j = 0; j < rows1.length; ++j) {
              array[parseInt(Math.floor(rows1[j].time))] = (rows1[j].value / 8 / 1024)
            }
            throughput.throughput.push(array);
            setTimeout(function() {
              ++i;
              callback();
            }, 100)
          });

        },
        function (err, n) {
          NetworkThroughput.create(throughput, function(err, nt) {
            if (err)
              console.log(err);
            console.log(nt.runid, nt.id);
          });
        }
      );
    });
  },
};

