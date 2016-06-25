
var Sim = require('./Sim')

//app = {in: , out:, instruction:}
module.exports = {
  t1: function(sim_env) {
    //sim_env: posX, vel, cells, handoverDistance, app, resource,
    var sim = Sim.getSim(sim_env);

    var stat = sim.sim();

    return stat;
  }
}
