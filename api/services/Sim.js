
var fs = require('fs')
var profile = JSON.parse(fs.readFileSync("./profile.json"));
var _ = require('underscore');
var Random = require('simjs-random');

var STEP = 10;
var transVel = {
  fast: { mps: 90 / 3.6, index: 1},
  slow: { mps: 30/ 3.6, index: 0}
}

module.exports = {
  getSim: function (opt) {
    var sim = {
      throughputMap: [],
      realThroughputMap: [],
      getProfile: function (param, tMap) {
        var posX = Math.round(param.posX / STEP);
        if (posX >= tMap[param.link][transVel[opt.vel].index].length)
          throw "Out of Range!";
        return tMap[param.link][transVel[opt.vel].index][posX].bw / 8;  // MB/s
      },
      sim: function() {
        var stat = {};
        for(var name in sim_env.apps) {
          app = opt.apps[name];
          stat[name] = { eTime: {}, pos: {}, throughput: {}, cell: {}, prevEnv: {}, realEnv: {} };
          this.tr(stat[name], app);
          this.proc(stat[name], app);
          this.rc(stat[name], app);
          this.prev(stat[name], app);
          this.real(stat[name], app);
        }
        return stat;
      },
      tr: function(stat, app) {
        stat.pos.tr = opt.posX;
        stat.cell.tr = Math.floor(stat.pos.tr / opt.handoverDistance);
        stat.eTime.tr = this.data(0, stat.pos.tr, app.tr, this.throughputMap);
        if(stat.eTime.tr === NaN)
          throw "Value Error";
        stat.throughput.tr = this.getProfile({link: 0, posX: stat.pos.tr}, this.throughputMap);
      },
      proc: function(stat, app) {
        stat.pos.proc = opt.posX + stat.eTime.tr * transVel[opt.vel].mps;
        stat.cell.proc = Math.floor(stat.pos.proc / opt.handoverDistance);
        stat.eTime.proc = this.calc(stat, app);
      },
      rc: function(stat, app) {
        stat.pos.rc = opt.posX + (stat.eTime.tr + stat.eTime.proc) * transVel[opt.vel].mps;
        stat.cell.rc = Math.floor(stat.pos.rc / opt.handoverDistance);
        stat.eTime.rc = this.data(1, stat.pos.rc, app.rc, this.throughputMap);
        stat.throughput.rc = this.getProfile({link: 1, posX: stat.pos.rc}, this.throughputMap);
        stat.eTime.total = stat.eTime.tr + stat.eTime.proc + stat.eTime.rc;
        stat.cell.rc = Math.floor((opt.posX + (stat.eTime.tr + stat.eTime.proc + stat.eTime.rc) * transVel[opt.vel].mps) / opt.handoverDistance);
      },
      prev: function(stat, app) {
        stat.prevEnv.tr = this.data(0, opt.posX, app.tr, this.throughputMap);
        stat.prevEnv.proc = Number.MAX_VALUE;

        var name = "";
        for (var vm = 0; vm < opt.resources.cloud.length; ++vm) {
          var tmp = app.cycle / (Math.min(app.parallel, opt.resources.cloud[vm].core.length) * opt.resources.cloud[vm].freq);
          if(stat.prevEnv.proc > tmp) {
            name = opt.resources.cloud[vm].Model;
            stat.prevEnv.proc = tmp;
          }
        }

        stat.prevEnv.rc = this.data(1, opt.posX, app.rc, this.throughputMap);
        stat.prevEnv.total = stat.prevEnv.tr + stat.prevEnv.proc + stat.prevEnv.rc;
      },
      real: function(stat, app) {
        stat.realEnv.tr = this.data(0, opt.posX, app.tr, this.realThroughputMap);
        stat.realEnv.proc = Number.MAX_VALUE;

        var name = "";
        for (var vm = 0; vm < opt.resources.cloud.length; ++vm) {
          opt.resources.cloud[vm].core.sort();
          var parallelism = Math.min(app.parallel, opt.resources.cloud[vm].core.length);

          var cumulatedFreq = 0;
          for(var core = 0; core < parallelism; ++core)
            cumulatedFreq += 1 - opt.resources.cloud[vm].core[core];
          var tmp = app.cycle / opt.resources.cloud[vm].freq * ((parallelism === 1)?1/cumulatedFreq:(0.05+0.95/cumulatedFreq));
          if(stat.realEnv.proc > tmp) {
            name = opt.resources.cloud[vm].Model;
            stat.realEnv.proc = tmp;
          }
        }

        var new_pos = opt.posX + (stat.realEnv.tr + stat.realEnv.proc) * transVel[opt.vel].mps;
        stat.realEnv.rc = this.data(1, new_pos, app.rc, this.realThroughputMap);
        stat.realEnv.total = stat.realEnv.tr + stat.realEnv.proc + stat.realEnv.rc;
      },
      data: function (link, posX, size, tMap) {
        var dt = STEP / transVel[opt.vel].mps;
        size /= (1024*1024);  //size in MB
        var elapsedTime = 0;
        while (size > 0) {
          var dtThroughput = (this.getProfile({link: link, posX: posX}, tMap) + this.getProfile({link: link, posX: posX + STEP}, tMap)) / 2; //MB/s
          var dtSize = Math.min(dt * dtThroughput, size);
          if(dtThroughput !== 0)
            elapsedTime += dtSize / dtThroughput;
          posX += STEP;
          size -= dtSize;
        }
        return elapsedTime;
      },
      calc: function (stat, app) {
        stat.vehicle = this.evaluateCPUPerf(opt.resources.vehicle, app);

        var perf = Number.MAX_VALUE;
        var name = "";
        for (var vm = 0; vm < opt.resources.cloud.length; ++vm) {
          var tmp = this.evaluateCPUPerf(opt.resources.cloud[vm], app);
          if(perf > tmp) {
            name = opt.resources.cloud[vm].Model;
            perf = tmp;
          }
        }

        return perf;
      },
      evaluateCPUPerf: function(resource, app) {
        var parallelism = Math.min(app.parallel, resource.core.length);
        resource.core.sort();
        var cumulatedFreq = 0;
        for(var core = 0; core < parallelism; ++core)
          cumulatedFreq += 1 - resource.core[core];
        cumulatedFreq *= resource.freq;
        return app.cycle / cumulatedFreq;
      }
    };

    createTMap(sim.throughputMap, opt.cells, opt.handoverDistance);
    createTMap(sim.realThroughputMap, opt.realcells, opt.handoverDistance);
    return sim;
  }
};

function createTMap(tMap, cells, handoverDistance) {
  var halfCellSize = Math.floor(handoverDistance / 2 / STEP);
  for (var link = 0; link <= 1; ++link) {
    tMap[link] = [];
    for (var vel = 0; vel <= 1; ++vel) {
      tMap[link][vel] = [];
      for(var i in cells) {
        var cell = cells[i];
        if(link === 0 && cell[link] >= 20)
          throw "Cell Setting Error on cell["+i+"]";
        tMap[link][vel].push(profile[cell[link]].link[link].vel[vel].dis.slice(0, halfCellSize).reverse(), profile[cell[link]].link[link].vel[vel].dis.slice(1, halfCellSize+1));
      }
      tMap[link][vel] = _.flatten(tMap[link][vel]);
    }
  }
}
