/**
 * NetworkProfileController
 *
 * @description :: Server-side logic for managing Networkprofiles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var aa = module.exports = {

  getProfile: function(req, res) {
    var mysql = require('mysql');
    var con = mysql.createConnection({
      host: "143.248.53.174",
      port: "33060",
      user: "kaist",
      password: "kaist",
      database: "broker_db"
    });

    var runid = 181;

    con.query("select * from broker_db.vector where runid="+runid+";", function(err, rows) {
      if(err || _.isUndefined(rows) || rows.length === 0){
        return;
      }

      var i = 0;
      async.whilst(
        function () { return i < rows.length; },
        function (callback) {
          var row = rows[i];
          if(row.module.indexOf('nic') > 0){
            ++i;
            callback();
            return;
          }
          NetworkProfile.find({ runid: runid, module: row.module, name: row.name }, function(err, np) {
            if(np.length>0){
              ++i;
              console.log("Exist: "+np[0].module+" " + np[0].name);
              callback();
              return;
            }
            console.log("Trial: " + row.module + " " + row.name);
            con.query('select * from vecdata where vectorid="' + row.id + '"', function (err, rows1) {
              console.log("GotIt: " + row.module + " " + row.name + " " + rows1.length);
              if(rows1.length > 50000) {
                console.log("Skip : "+row.module+" " + row.name);
                ++i;
                callback();
                return;
              }

              var profile = {runid: runid, module: row.module, name: row.name, vector: rows1};
              NetworkProfile.create(profile, function (err, np) {
                console.log("Saved: " + np.module + " " + np.name);
                setTimeout(function () {
                  ++i;
                  callback();
                }, 100)
              });
            });
          });
        },
        function (err) {
          if (err)
            console.log(err);
        }
      );
    });
  }
};
