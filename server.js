const express = require('express');
const cors = require('cors');
const pool = require('./database');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({limit: '50mb'}));

app.post('/import', async (req, res) => {
    const streetCleaningInfo = req.body;

    try{
        for(const info of data){
            await pool.query(
                `INSERT INTO Street Cleaning
                (day, time, side, from_street, on_street, to_street, borough, sign_description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8,)`
            )
        }

        res.json({
            success: true
        });
    }
    catch(error){
        
    }
})

app.listen(PORT, () => {
    console.log("Server is now running...");
})