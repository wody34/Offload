var Sim = require('simjs');
var Random = require('simjs-random');
// Facility = Sim.Facility;
// // Buffer = Sim.Buffer;
// Store = Sim.Store;
// Event = Sim.Event;
// Request = Sim.Request;
// Queue = Sim.Queue;
// PQueue = Sim.PQueue;
// DataSeries = Sim.DataSeries;
// TimeSeries  = Sim.TimeSeries;
// Population = Sim.Population;

function trafficLightSimulation(GREEN_TIME, MEAN_ARRIVAL, SEED, SIMTIME) {
  var sim = new Sim();
  var random = new Random(SEED);
  var trafficLights = [new Sim.Event("North-South Light"),
    new Sim.Event("East-West Light")];
  var stats = new Sim.Population("Waiting at Intersection");

  var LightController = {
    currentLight: 0,  // the light that is turned on currently
    start: function () {
      sim.log(trafficLights[this.currentLight].name + " OFF"
        + ", " + trafficLights[1 - this.currentLight].name + " ON");
      sim.log("------------------------------------------");
      // turn off the current light
      trafficLights[this.currentLight].clear();

      // turn on the other light.
      // Note the true parameter: the event must "sustain"
      trafficLights[1 - this.currentLight].fire(true);

      // update the currentLight variable
      this.currentLight = 1 - this.currentLight;

      // Repeat every GREEN_TIME interval
      this.setTimer(GREEN_TIME).done(this.start);
    }
  };

  var Traffic = {
    start: function () {
      this.generateTraffic("North"); // traffic for North -> South
      this.generateTraffic("South", trafficLights[0]); // traffic for South -> North
      this.generateTraffic("East", trafficLights[1]); // traffic for East -> West
      this.generateTraffic("West", trafficLights[1]); // traffic for West -> East
    },
    generateTraffic: function (direction, light) {
      // STATS: record that vehicle as entered the intersection
      stats.enter(this.time());
      sim.log("Arrive for " + direction);
      console.log('direction')
      // wait on the light.
      // The done() function will be called when the event fires
      // (i.e. the light turns green).
      this.waitEvent(light).done(function () {
        var arrivedAt = this.callbackData;
        // STATS: record that vehicle has left the intersection
        stats.leave(arrivedAt, this.time());
        sim.log("Leave for " + direction + " (arrived at " + arrivedAt.toFixed(6) + ")");
      }).setData(this.time());

      // Repeat for the next car. Call this function again.
      var nextArrivalAt = random.exponential(1.0 / MEAN_ARRIVAL);
      this.setTimer(nextArrivalAt).done(this.generateTraffic, this, [direction, light]);
    }
  };

  sim.addEntity(LightController);
  sim.addEntity(Traffic);

//    Uncomment to display logging information
//    sim.setLogger(function (str) {
//        document.write(str);
//    });

  // simulate for SIMTIME time
  sim.simulate(SIMTIME);

  return [stats.durationSeries.average(),
    stats.durationSeries.deviation(),
    stats.sizeSeries.average(),
    stats.sizeSeries.deviation()];

}

// console.log(trafficLightSimulation(5, 1000, 0, 100000));
// console.log(require("./ProfileProvider").getProfile(1, 1, 30, 422));
var a =  require("./NewTest");
sim_env = {
  cells: [[15, 1], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10], [5, 10]],
  realcells: [[15, 1], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50], [19, 50]],
  handoverDistance: 1000,
  posX: 20,
  vel: 'slow',
  apps: {
    voiceCommand: {
      cycle: 2550000000,
      tr: 166242,
      rc: 28,
      parallel: 1
    },
    voiceQuery: {
      cycle: 2550000000+25901448907,
      tr: 166242,
      rc: 7,
      parallel: 1
    },
    vision240p: {
      cycle: 232508182760/23/360 * 200,
      tr: 3013874/360 * 200,
      rc: 41900 * 200,
      parallel: 4
    },
    visionFHD: {
      cycle: 333871745528/10/18 * 200,
      tr: 2424529193/166488 * 200,
      rc: 41900 * 200,
      parallel: 8
    }
  },
  resources: {
    vehicle: {
      freq:1200000000,
      core:[0.1, 0.1],
    },
    cloud: [
      {Model: 'i5_4590',freq:3300000000, core:[0.1, 0.2, 0.3, 0.4]},
      {Model: 'i7_4790',freq:3600000000, core:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]},
      {Model: 'i5_4590',freq:2270000000, core:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]},
    ]
  }
};
a.t1(sim_env);
