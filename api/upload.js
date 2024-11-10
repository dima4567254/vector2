const express = require('express');
const router = express.Router();

router.post((req, res) => {
  // ваш код обработки загрузки
  res.status(200).send("Файл успешно загружен!");
});

module.exports = router;
