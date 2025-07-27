const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./routes/riders');
const inspectionRoutes = require('./routes/inspections');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/riders', employeeRoutes);
app.use('/api/inspections', inspectionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});