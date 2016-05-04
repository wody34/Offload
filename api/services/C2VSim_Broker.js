var mysql = require('mysql');


var _SimConfigTemplate = {
  networkThroughput: []
};
var _SimResultTemplate = {
  vertex: [],
  totalState: "wait",
  totalExecutionTimeResult: 0,
  totalCloudCost: 0,
  totalCloudExecutionTimeResult: 0,
  progressingExecutionTime: 0
};

var SimState = "Initial";
var SimConfig = {};
var SimResult = {totalState: "wait"};
var sleepSec = 1;
var OffloadingMethod = {
  noOffloading: function() {
    return 0;
  },
  ModifiedMAUI1: function() {
    var vertexSize = SimConfig.app.length;
    var vertexArray = SimConfig.app;
    var solution = 0;
    var objectiveValue = Number.MAX_VALUE;

    var unfeasibility = 0;
    for(var i in vertexArray)
      unfeasibility += ((vertexArray[i].attr ^ 1) << i);
    for (var sol_case = 0; sol_case < (1 << vertexSize); ++sol_case) {
      if(unfeasibility & sol_case)
        continue;
      var tempObjectiveValue = 0;
      for(var i = 0; i <= vertexSize; ++i) {
        var vertex = (i !== vertexSize)?vertexArray[i]:{MI: 0, inputSize:vertexArray[i-1].outputSize};
        var curOffloading = ((sol_case >> i) & 1);
        var prevOffloading = (sol_case >> (i+1)) & 1;

        var offloadingSelect = (curOffloading === 0) ? 'intraVehicle' : 'cloud';
        var model = SimConfig.model[offloadingSelect + 'Model'];
        tempObjectiveValue += ExecutionTimeMethod[offloadingSelect][model.model]({
          MIPS: parseFloat(model.MIPS),
          MI: parseFloat(vertex.MI)
        });

        //Input Data Transfer
        tempObjectiveValue += (prevOffloading !== curOffloading) ? DataTransferTimeMethod.simple(parseFloat(vertex.inputSize), SimConfig.networkThroughput[0]) : 0;
      }

      if(tempObjectiveValue < objectiveValue) {
        objectiveValue = tempObjectiveValue;
        solution = sol_case;
      }
    }
    return solution;
  },
  allOffloading: function() {
    var solution = 0;
    for (var i in SimConfig.app)
      solution += (parseInt(SimConfig.app[i].attr) << i)
    return solution;
  }
};

var DataTransferTimeMethod = {
  simple: function(inputSize, Bps) {
    return inputSize/Bps;
  }
};

var ExecutionTimeMethod = {
  intraVehicle: {
    iCanCloud: function(param) {
      return param.MI / param.MIPS;
    }
  },
  cloud: {
    iCanCloud: function(param) {
      return param.MI / param.MIPS;
    }
  }
}

module.exports = {
  start: function(modelID, appID, callback) {
    async.waterfall([
      function initSim(cb) {
        SimConfig = deepClone(_SimConfigTemplate);
        SimState = "Initial";
        cb();
      },
      function modelAccess(cb) {
        C2VModel.find(modelID).exec(function (err, models) {
          SimConfig.model = models[0]
          cb(err);
        })
      },
      function appAccess(cb) {
        C2VApp.find(appID).exec(function (err, apps) {
          SimConfig.app = apps[0].app;
          SimConfig.app.push({
            name: 'End',
            MI: 0,
            inputSize: SimConfig.app[SimConfig.app.length-1].outputSize,
            prevVertex: SimConfig.app[SimConfig.app.length-1].postVertex,
            postVertex: "null"
          });
          cb(err);
        })
      },
      function dbAccess(cb) {
        SimResult.totalState = "profiling"
        SimState = "DB Access"

        NetworkThroughput.find({runid: 181}, function(err, rows) {
          SimConfig.networkThroughput = rows[0].throughput[0].splice(19, rows[0].throughput[0].length);
          console.log(SimConfig.networkThroughput);
          cb(err);
        });
      },
      function noOffloading(cb) {
        SimState = "No Offloading";
        var methodName = "noOffloading";
        simulation(OffloadingMethod[methodName](), function() {
          var result = {};
          result[methodName] = deepClone(SimResult);
          cb(null, result);
        });
      },
      function methodOffloading(result, cb) {
        SimState = SimConfig.model.offloadingModel.model;
        var methodName = SimConfig.model.offloadingModel.model;
        simulation(OffloadingMethod[methodName](), function() {
          result[methodName] = deepClone(SimResult);
          cb(null, result);
        });
      },
      function allOffloading(result, cb) {
        SimState = "Offloading All Possible Vertices";
        var methodName = "allOffloading";
        simulation(OffloadingMethod[methodName](), function() {
          result[methodName] = deepClone(SimResult);
          cb(null, result);
        });
      }
    ], function (err, result) {
      if(err)
        console.log(err);
      console.log("C2V Connected Vehicle Simulator Successfully ended..");
      result.message = "C2V Connected Vehicle Simulator Successfully ended..";
      callback(result);
    });
  },
  getNetworkThroughput: function() {
    return SimConfig.networkThroughput;
  },
  getState: function() {
    return _.extend(SimResult, {SimState: SimState});
  }
}

function simulation(offloading, callback) {
  SimResult = deepClone(_SimResultTemplate);
  SimResult.totalState = "execution";

  for (var i = 0; i < SimConfig.app.length; ++i) {
    SimResult.vertex.push(_.extend(SimConfig.app[i], {
      state: "wait",
      executionTimeResult: 0,
      dataTransferResult: 0,
      offloading: (offloading >> i) & 1
    }));
  }
  var i = 0;
  async.whilst(
    function() {
      return i < SimResult.vertex.length;
    },
    function(fe_cb) {
      var curVertex = SimResult.vertex[i];
      var prevVertex = (i === 0)?{offloading: 0}:SimResult.vertex[i-1];
      async.waterfall([
          function dataTransfer(cb) {
            //Input Data Transfer
            curVertex.dataTransferResult = (prevVertex.offloading !== curVertex.offloading) ? DataTransferTimeMethod.simple(parseFloat(curVertex.inputSize), SimConfig.networkThroughput[Math.round(SimResult.progressingExecutionTime)]) : 0;

            SimResult.totalCloudExecutionTimeResult += curVertex.dataTransferResult;
            SimResult.progressingExecutionTime += curVertex.dataTransferResult;
            cb(null, sleepSec);
          },
          timeOutSec,
          function computation(cb) {
            //Computation
            curVertex.state = "execution";
            var offloadingSelect = (curVertex.offloading === 0) ? 'intraVehicle' : 'cloud';
            var model = SimConfig.model[offloadingSelect + 'Model'];
            curVertex.executionTimeResult = ExecutionTimeMethod[offloadingSelect][model.model]({
              MIPS: parseFloat(model.MIPS),
              MI: parseFloat(curVertex.MI)
            });
            SimResult.totalCloudExecutionTimeResult += (curVertex.offloading)?curVertex.executionTimeResult:0;
            SimResult.progressingExecutionTime += curVertex.executionTimeResult;
            cb(null, sleepSec);
          },
          timeOutSec,
          function end(cb) {
            curVertex.state = "end";
            SimResult.totalExecutionTimeResult += curVertex.executionTimeResult + curVertex.dataTransferResult;
            cb();
          }],
        function (err) {
          if(err)
            fe_cb(err)
          fe_cb();
        }
      );
      ++i;
    },
    function (err) {
      if(err)
        throw err;
      SimResult.totalCloudCost = SimResult.totalCloudExecutionTimeResult / 3600 * parseFloat(SimConfig.model.cloudModel.pricing);
      SimResult.totalState = "end";
      callback();
    }
  );
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function timeOutSec(sec, cb) {
  setTimeout(function() {
    cb();
  }, sec * 1000);
}
