const { Pool } = require("pg");
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: "Parking_Tracker",
    user: 'postgres',
    password: '4474'
})

module.exports = pool;

