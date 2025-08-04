const express = require('express');
const router = express.Router();

router.get('/users', (req, res) => {
  res.json([{ name: 'Ali' }, { name: 'Ahmed' }]);
});

module.exports = router;
