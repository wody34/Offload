/**
 * SimController
 *
 * @description :: Server-side logic for managing Sims
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	t1: function(req, res) {
    try {
    res.json(NewTest.t1(req.body));
    } catch(err) {
      res.json("Error");
    }
  }
};

