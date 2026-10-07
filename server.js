const express = require('express');
const cors = require('cors');
const pool = require('./database');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({limit: '50mb'}));

app.post('/import', async (req, res) => {
    const streetCleaningInfo = req.body;
    //console.log(streetCleaningInfo);

    try{
        for(let i = 0; i < streetCleaningInfo.length; i++){
            let unavailableDays = [];
            let time = [];
            let side;
            let borough;
            let fromStreet;
            let toStreet;
            let onStreet;

            let str = streetCleaningInfo[i].sign_description
            if(str.indexOf('NO PARKING') != -1){
                unavailableDays = str.match(/\b(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN)(?:\s*(?:-|THRU)\s*(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN))?\b|NO\s+PARKING\s+ANYTIME/gi);
                time = str.match(/((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))-((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))/i);
                side = streetCleaningInfo[i].side_of_street;
                borough = streetCleaningInfo[i].borough;
                fromStreet = streetCleaningInfo[i].from_street;
                toStreet = streetCleaningInfo[i].to_street;
                onStreet = streetCleaningInfo[i].on_street;

                const result = await pool.query(
                    `INSERT INTO street_cleaning (day, time, side, borough, from_street, to_street, on_street)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [unavailableDays, time, side, borough, fromStreet, toStreet, onStreet]
                );
            }
        }

        res.json({
            success: true
        });
    }
    catch(error){
        console.error(error);
    }
})

app.listen(PORT, () => {
    console.log("Server is now running...");
})