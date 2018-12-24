module.exports = function(app, db) {
  app.post('/board/add', (req, res) => {
    const name = req.body.name;

    console.log(name);
  });
};
