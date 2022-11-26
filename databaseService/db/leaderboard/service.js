const dao = require('./dao')

module.exports = (app) => {

  const findLeaderboard = (req, res) =>
    dao.findLeaderboard()
      .then(leaderboard => res.json(leaderboard));

  app.get("/rest/leaderboard", findLeaderboard);

}




