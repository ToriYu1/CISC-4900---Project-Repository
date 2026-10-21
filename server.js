const express = require('express');
const cors = require('cors');
const { pool, getAllData } = require('./database');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({limit: '50mb'}));

app.get('/getStreetCleaningData', async (req, res) =>{
    try{
        const {minLatitude, maxLatitude, minLongitude, maxLongitude} = req.query;
        const result = await pool.query(`
            SELECT latitude, longitude, latitude2, longitude2
            FROM street_cleaning
            WHERE (latitude BETWEEN ${minLatitude} AND ${maxLatitude} AND longitude BETWEEN ${minLongitude} AND ${maxLongitude})
                OR (latitude2 BETWEEN ${minLatitude} AND ${maxLatitude} AND longitude2 BETWEEN ${minLongitude} AND ${maxLongitude})
            `
        );
        const data = result.rows;
        res.json(data);
    }
    catch(error){
        console.log("Error: " + error.message);
    }
})

function sleep(ms = 0){
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBlockface(onStreet, crossStreetOne, crossStreetTwo, borough){
    console.log("Fetching Blockface...")
    const key = "49d4ede677954ca2b88babc08256ef60"
    const url = "https://api.nyc.gov/geoclient/v2/blockface.json";

    const params = new URLSearchParams({
        onStreet,
        crossStreetOne,
        crossStreetTwo,
        borough
    })

    try{
        const response = await fetch(`${url}?${params}`, {
            headers: {
                "Ocp-Apim-Subscription-Key": key,
            },
        })

        const data = await response.json();
        const blockfaceData = data.blockface;
        const latnLong = [
            [blockfaceData.latitudeOfFromIntersection, blockfaceData.longitudeOfFromIntersection],
            [blockfaceData.latitudeOfToIntersection, blockfaceData.longitudeOfToIntersection]
        ];

        return latnLong;
    }
    catch(error){
        console.log(error.message);
    }
}

async function fetchIntersection(crossStreetOne, crossStreetTwo, borough){
    const key = "49d4ede677954ca2b88babc08256ef60"
    const url = "https://api.nyc.gov/geoclient/v2/intersection";

    const params = new URLSearchParams({
        crossStreetOne,
        crossStreetTwo,
        borough,
    })

    try{
        const response = await fetch(`${url}?${params}`, {
            headers: {
                "Ocp-Apim-Subscription-Key": key,
            },
        })

        const data = await(response.json());
        const intersection = data.intersection;

        return [intersection.latitude, intersection.longitude];
    } catch (error){
        console.log(error.message);
    }
}

app.post('/import', async (req, res) => {
    const streetCleaningInfo = req.body;

    try{
        for(let i = 0; i < streetCleaningInfo.length; i++){
            let unavailableDays = [];
            let time = [];
            let side;
            let borough;
            let fromStreet;
            let toStreet;
            let onStreet;
            let sign_code;
            let order_number;
            let distance_from_intersection;
            let latitude;
            let longitude;
            let latitude2;
            let longitude2;
            let point;
            let point2;

            let str = streetCleaningInfo[i].sign_description
            if(str.indexOf('NO PARKING') != -1){
                unavailableDays = str.match(/\b(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN)(?:\s*(?:-|THRU)\s*(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN))?\b|NO\s+PARKING\s+ANYTIME/gi);
                time = str.match(/((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))-((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))/i);
                side = streetCleaningInfo[i].side_of_street;
                borough = streetCleaningInfo[i].borough;
                fromStreet = streetCleaningInfo[i].from_street;
                toStreet = streetCleaningInfo[i].to_street;
                onStreet = streetCleaningInfo[i].on_street;
                sign_code = streetCleaningInfo[i].sign_code;
                order_number = streetCleaningInfo[i].order_number;
                distance_from_intersection = streetCleaningInfo[i].distance_from_intersection;

                //Get the geocode location of street cleaning locations
                point = await(fetchIntersection(onStreet, fromStreet, borough));
                await sleep(40); //Delay to avoid exceeding API rate limit
                point2 = await(fetchIntersection(onStreet, toStreet, borough));

                console.log(point, point2);
                if(point[0] == null || point2[0] == null){
                    console.log("Undefined?");
                    const pointData = await(fetchBlockface(onStreet, fromStreet, toStreet, borough));
                    latitude = pointData[0][0];
                    longitude = pointData[0][1];
                    latitude2 = pointData[1][0];
                    longitude2 = pointData[1][1];
                }
                else{
                    latitude = point[0];
                    longitude = point[1];
                    latitude2 = point2[0];
                    longitude2 = point2[1];
                }

                const query = await pool.query(
                    `INSERT INTO street_cleaning (day, time, side, borough, from_street, to_street, on_street, sign_code, order_number, distance_from_intersection, latitude, longitude, latitude2, longitude2)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (sign_code, order_number, distance_from_intersection)
                    DO NOTHING
                    `, [unavailableDays, time, side, borough, fromStreet, toStreet, onStreet, sign_code, order_number, distance_from_intersection, latitude, longitude, latitude2, longitude2]     
                );
            }
        }

        console.log('Finished');
        res.json({
            success: true}
        );
    }
    catch(error){
        console.error(error);
    }
})

app.listen(PORT, () => {
    console.log("Server is now running...");
})