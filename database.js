const { Pool } = require("pg");
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: "Parking_Tracker",
    user: 'postgres',
    password: '4474'
})

async function getAllData(){
    const result = await pool.query('SELECT * FROM street_cleaning');
    return result.rows;
}

module.exports = { pool, getAllData };

