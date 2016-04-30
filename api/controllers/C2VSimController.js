/**
 * C2VSimController
 *
 * @description :: Server-side logic for managing C2vsims
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  C2VSim_Start: function(req, res) {
    console.log(req.param('model'), req.param('app'));
    C2VSim_Broker.start(req.param('model'), req.param('app'), function(result) {
      res.json(result);
    });
  },
  C2VSim_NetworkThroughput: function(req, res) {
    console.log('NetworkThroughput');
    res.json(C2VSim_Broker.getNetworkThroughput());
  },
  verify: function(req, res) {
    console.log('verify');
    res.send("C2V Connected Vehicle Simulator Successfully started..");
  },
  C2VSim_State: function(req, res) {
    res.json(C2VSim_Broker.getState());
  },
  C2VSim_Start_Multi: function(req, res) {
    console.log(req.param('model'), req.param('app'));
    C2VSim_Broker_Multi.start(req.param('model'), req.param('app'), function(result) {
      res.json(result);
    });
  }
};

