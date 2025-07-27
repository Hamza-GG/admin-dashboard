const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all employees
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM riders ORDER BY joined_at DESC');
  res.json(result.rows);
});

// Add new employee
router.post('/', async (req, res) => {
  const { first_name, first_last_name, id_number, city_code, vehicle_type } = req.body;

  const result = await db.query(
    `INSERT INTO riders (first_name, first_last_name, id_number, city_code, vehicle_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [first_name, first_last_name, id_number, city_code, vehicle_type]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;