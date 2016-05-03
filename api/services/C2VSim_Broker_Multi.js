var mysql = require('mysql');
var Sim = require('simjs');
var Random = require('simjs-random');

var random = new Random(0);
var LAMBDA = 700;
var sim = new Sim();
var stats = new Sim.Population();

var _SimConfigTemplate = {
  networkThroughput: []
};
var _SimResultTemplate = {
  task: [],
  totalState: "wait",
  totalExecutionTimeResult: 0,
  totalCloudCost: 0,
  totalCloudExecutionTimeResult: 0,
  progressingExecutionTime: 0
};

var SimState = "Initial";
var SimConfig = {};
var SimResult = {totalState: "wait"};
var sleepSec = 5;
var vehicles = [];
var vms = [];
var OffloadingMethod = {
  noOffloading: function() {
    return 0;
  },
  ModifiedMAUI1: function(test_vm) {
    var taskSize = SimConfig.app.length;
    var taskArray = SimConfig.app;
    var solution = 0;
    var objectiveValue = Number.MAX_VALUE;

    if(test_vm === null)
      return OffloadingMethod.noOffloading();

    var unfeasibility = 0;
    for(var i in taskArray)
      unfeasibility += ((taskArray[i].attr ^ 1) << i);
    for (var sol_case = 0; sol_case < (1 << taskSize); ++sol_case) {
      if(unfeasibility & sol_case)
        continue;
      var tempObjectiveValue = 0;
      for(var i = 0; i <= taskSize; ++i) {
        var task = (i !== taskSize)?taskArray[i]:{MI: 0, inputSize:taskArray[i-1].outputSize};
        var curOffloading = ((sol_case >> i) & 1);
        var prevOffloading = (sol_case >> (i+1)) & 1;

        var offloadingSelect = (curOffloading === 0) ? 'intraVehicle' : 'cloud';
        var model = SimConfig.model[offloadingSelect + 'Model'];
        tempObjectiveValue += ExecutionTimeMethod.cloud.iCanCloud({
          MIPS: parseFloat(test_vm.MIPS),
          MI: parseFloat(task.MI)
        });

        //Input Data Transfer
        tempObjectiveValue += (prevOffloading !== curOffloading) ? DataTransferTimeMethod.simple(parseFloat(task.inputSize), SimConfig.networkThroughput[0]) : 0;
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
        SimResult = deepClone(_SimResultTemplate);
        SimState = "Initial";
        cb();
      },
      function appAccess(cb) {
        C2VApp.find(appID).exec(function (err, apps) {
          SimConfig.app = apps[0].app;
          SimConfig.app.push({
            name: 'End',
            MI: 0,
            inputSize: SimConfig.app[SimConfig.app.length-1].outputSize
          });
          cb(err);
        })
      },
      function dbAccess(cb) {
        SimResult.totalState = "profiling"
        SimState = "DB Access"
        NetworkThroughput.find({runid: 181}, function(err, rows) {
          SimConfig.networkThroughput = rows[0].throughput[0].splice(19, rows[0].throughput[0].length);
          cb(err);
        });
      },
      function modelAccess(cb) {
        C2VModel.find(modelID).exec(function (err, models) {
          SimConfig.model = models[0];
          vehicles = vehicleGenerator(SimConfig.model.intraVehicleModel, SimConfig.model.intraVehicleModel);
          vms = vmGenerator((SimConfig.model.cloudModel));
          // console.log(vehicles, vms);
          cb(err);
        })
      },
      function simulation(cb) {
        sim.simulate(SimConfig.model.simulationSpec.simulationTime);
        cb();
      }
    ], function (err, result) {
      if(err)
        console.log(err);
      console.log("C2V Connected Vehicle Simulator Successfully ended..");
      SimResult.cloudUtilization = SimResult.totalCloudExecutionTimeResult/(SimConfig.model.simulationSpec.simulationTime * vms.length);
      result = SimResult;
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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function vehicleGenerator(intraVehicleModel, interVehicleModel) {
  var vehicles = [];
  var max = intraVehicleModel.maxMIPS;
  var min = intraVehicleModel.minMIPS;
  for(var i = 0; i < interVehicleModel.vehicleNumber; ++i) {
    (function() {
      var id = i;
      var model = intraVehicleModel.model;
      var MIPS = rand(min, max);
      var new_vehicle = {
        start: function() {
          this.id = id;
          this.model = model;
          this.MIPS = MIPS;
          this.tasks = [];
          // console.log(this.id, this.MIPS);
          var nextArrivalAt = random.exponential(1.0 / LAMBDA);
          this.setTimer(nextArrivalAt).done(this.generateTask, this);
        },
        generateTask: function() {
          var time = this.time();
          sim.log("New Task gen");
          var task = [];
          SimResult.totalState = "execution";

          var test_vm = selectBestVM();
          console.log(test_vm)
          var offloading = OffloadingMethod.allOffloading(test_vm);
          var appID = _.uniqueId()
          for (var i = 0; i < SimConfig.app.length; ++i) {
            task.push(_.extend(deepClone(SimConfig.app[i]), {
              state: "wait",
              executionTimeResult: 0,
              dataTransferResult: 0,
              offloading: (offloading >> i) & 1,
              id: this.id + "-" + _.uniqueId(),
              vehicleID: this.id
            }));
          }
          task.id = appID;
          task.cur = 0;
          task[task.cur].txTime = time;
          this.tasks.push(task);
          SimResult.task.push(task);
          // console.log(task);
          this.setTimer(0).done(this.taskStart, this, [task]);

        },
        onMessage: function (sender, message) {
          // Receive message, add own name and send back
          //start communication
          if(message.body === 'TX') {
            var time = this.time();
            task = message.task;
            console.log(_.template('[Task<%= id %>] Rx return to vehicle[<%= receiver %>] at vm[<%= sender %>]')({id: task[task.cur].id, sender: this.id, receiver: sender.id}));
            this.setTimer(DataTransferTimeMethod.simple(task[task.cur].inputSize, getNT(time))).done(this.taskStart, this, [message.task]);
          }
        },
        taskStart: function (task) {
          var time = this.time();
          task[task.cur].rxTime = time;
          var location = selectBestVM();
          if(task[task.cur].offloading === 1 && location !== null) {
            task.offloadingResourceShortage = 1;
          }

          if(task[task.cur].offloading === 1 && location !== null) {
            this.send({body:"TX", task: task}, 0, location);
          }
          else {
            console.log(_.template('[Task<%= id %>] Start process at vehicle[<%= vehicle %>]')({id: task[task.cur].id, vehicle: this.id}));
            task[task.cur].procStartTime = time;
            task[task.cur].execLoc = 0;

            var executionTime = ExecutionTimeMethod.intraVehicle[this.model]({MI: task[task.cur].MI, MIPS: this.MIPS});
            this.setTimer(executionTime).done(this.taskEnd, this, [task]);
          }
        },
        taskEnd: function(task) {
          console.log(_.template('[Task<%= id %>] End process at vehicle[<%= receiver %>]')({id: task[task.cur].id, receiver: this.id}));
          var time = this.time();
          task[task.cur].procEndTime = time;
          task[task.cur].state = "end";
          ++task.cur;


          if(_.isUndefined(task[task.cur])) {
            task.dataTransferResult = 0;
            task.executionTimeResult = 0;
            task.totalCloudExecutionTimeResult = 0;
            task.totalCloudCost = 0;
            for(var i = 0; i < task.cur; ++i) {
              task[i].dataTransferResult = task[i].rxTime - task[i].txTime;
              task[i].executionTimeResult = task[i].procEndTime - task[i].procStartTime;
              task.dataTransferResult += task[i].dataTransferResult;
              task.executionTimeResult += task[i].executionTimeResult;
              if(task[i].execLoc === 1) {
                task.totalCloudExecutionTimeResult += task[i].executionTimeResult;
                task.totalCloudCost += task[i].executionTimeResult / 3600 * parseFloat(task[i].compPricing);
              }
            }
            SimResult.totalCloudExecutionTimeResult += task.totalCloudExecutionTimeResult;
            SimResult.totalCloudCost += task.totalCloudCost;
            SimResult.totalExecutionTimeResult += task.executionTimeResult + task.dataTransferResult;
            console.log(task);
            var nextArrivalAt = random.exponential(1.0 / LAMBDA);
            this.setTimer(nextArrivalAt).done(this.generateTask, this);

          }
          else {
            task[task.cur].txTime = time;
            this.setTimer(0).done(this.taskStart, this, [task]);
          }
        }
      }
      new_vehicle = sim.addEntity(new_vehicle);
      vehicles.push(new_vehicle);
    })();
  }
  console.log(_.template("[Generate]: #<%= length %> of Vehicle Entity type of with MIPS(<%= min %>,<%= max %>)")({length:interVehicleModel.vehicleNumber, min:min, max:max}));
  return vehicles;
}

function vmGenerator(cloudModel) {
  var vms = [];
  for(var index in cloudModel) {
    var cloud = cloudModel[index];
    for(var i = 0; i < cloud.availableVMNumber; ++i) {
      (function() {
        var cloudType = cloud.cloudType;
        var instanceType = cloud.instanceType;
        var compPricing = cloud.compPricing;
        var model = cloud.model;
        var MIPS = rand(cloud.minMIPS, cloud.maxMIPS);
        var id = index * cloud.availableVMNumber + i;
        var new_vm = {
          start: function () {
            this.cloudType = cloudType;
            this.instanceType = instanceType;
            this.compPricing = compPricing;
            this.model = model;
            this.MIPS = MIPS;
            this.id = id;
            this.availability = 1;//new Sim.Event("vm["+id+"] availability");
            // console.log(this.id, this.cloudType);
          },
          onMessage: function (sender, message) {
            // Receive message, add own name and send back
            //start communication
            if(message.body === 'TX') {
              this.availability = 0;
              var time = this.time();
              task = message.task;
              task[task.cur].txTime = time;
              console.log(_.template('[Task<%= id %>] Tx from vehicle[<%= sender %>] to vm[<%= receiver %>]')({id: task[task.cur].id, sender: sender.id, receiver: this.id}));
              this.setTimer(DataTransferTimeMethod.simple(task[task.cur].inputSize, getNT(time))).done(this.taskStart, this, [sender, message.task]);
            }
          },
          taskStart: function (sender, task) {
            console.log(_.template('[Task<%= id %>] Rx and start process at vm[<%= receiver %>]')({id: task[task.cur].id, receiver: this.id}));
            var time = this.time();
            task[task.cur].rxTime = task[task.cur].procStartTime = time;
            task[task.cur].execLoc = 1;
            task[task.cur].VMID = this.id;
            task[task.cur].compPricing = this.compPricing;
            var executionTime = ExecutionTimeMethod.cloud[this.model]({MI: task[task.cur].MI, MIPS: this.MIPS});
            this.setTimer(executionTime).done(this.taskEnd, this, [sender, task]);
          },
          taskEnd: function(sender, task) {
            console.log(_.template('[Task<%= id %>] End process at vm[<%= receiver %>]')({id: task[task.cur].id, receiver: this.id}));

            var time = this.time();
            task[task.cur].procEndTime = time;
            task[task.cur].state = "end";
            ++task.cur;
            task[task.cur].txTime = time;
            if(task[task.cur].offloading === 0) {
              console.log(_.template('[Task<%= id %>] Tx return to vehicle[<%= receiver %>] at vm[<%= sender %>]')({id: task[task.cur].id, sender: this.id, receiver: sender.id}));
              this.setTimer(DataTransferTimeMethod.simple(task[task.cur].inputSize, getNT(time))).done(this.taskReturn, this, [sender, task]);
            }
            else {
              console.log(_.template('[Task<%= id %>] continue process at vm[<%= receiver %>]')({id: task[task.cur].id, receiver: this.id}));
              this.setTimer(0).done(this.taskStart, this, [sender, task]);
            }
          },
          taskReturn: function(sender, task) {
            this.availability = 1;
            this.send({body: 'TX', task: task}, 0, sender);
          }
        };
        new_vm = sim.addEntity(new_vm);
        vms.push(new_vm);

      })();
    }
    console.log(_.template("[Generate]: #<%= length %> of Virtual Machine Entity type of '<%= cloudType %>:<%= instanceType %> with MIPS(<%= min %>,<%= max %>)'")({length: cloud.availableVMNumber, cloudType: cloud.cloudType, instanceType: cloud.instanceType, min: cloud.minMIPS, max: cloud.maxMIPS}));
  }

  return vms;
}

function rand(min, max) {
  return Math.floor(Math.random()*(max-min)+min);
}

function getNT(time) {
  return SimConfig.networkThroughput[parseInt(Math.floor(time))%SimConfig.networkThroughput.length];
}

function selectBestVM() {
  var select = null;
  var max = Number.MIN_VALUE
  for(var i in vms) {
    var vm = vms[i];
    if(vm.availability && vm.MIPS > max) {
      select = vm;
      max = vm.MIPS;
    }
  }
  return select;
}
