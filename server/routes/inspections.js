const express = require('express');
const router = express.Router();
const db = require('../db');

// Add new inspection
router.post('/', async (req, res) => {
  const { rider_id, inspected_by, helmet_ok, box_ok, id_ok, zone_ok, clothes_ok, well_behaved } = req.body;
  const result = await db.query(
    `INSERT INTO inspections (rider_id, inspected_by, helmet_ok,box_ok, id_ok, zone_ok,  clothes_ok, well_behaved)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [rider_id, inspected_by, helmet_ok, box_ok, id_ok, zone_ok, clothes_ok, well_behaved]
  );
  res.status(201).json(result.rows[0]);
});

// Get all inspections
router.get('/', async (req, res) => {
  const result = await db.query(`
    SELECT inspections.*, riders.first_name 
    FROM inspections 
    JOIN riders ON inspections.rider_id = riders.rider_id
    ORDER BY timestamp DESC
  `);
  res.json(result.rows);
});

module.exports = router;