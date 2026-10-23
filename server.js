//Variables
const express = require('express');
const cors = require('cors');
const { pool, getAllData } = require('./database');
const app = express();
const PORT = 3000;
const proj4 = require('proj4');
const epsg2263 = "+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs'";

//Function
function ConvertCoordinatesToLatLong(x,y){
    console.log("Test: " + x + " " + y);
    let x1 = parseFloat(x);
    let y1 = parseFloat(y);

    const [long, lat] = proj4(epsg2263, "EPSG:4326", [x1,y1]);
    return {latitude: lat, longitude: long};
}


app.use(cors());
app.use(express.json({limit: '500mb'}));

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

//Import latitude/longitude data from centerline.csv 
app.post('/importLatNLong', async (req, res) => {
    const info = req.body;

    try{
        
    }catch(error){
        console.log(error.message);
    }
})

//Import data into street_cleaning database
app.post('/import', async (req, res) => {
    const info = req.body;

    try{
        //Filter data to only get the tables where sign_description mentions "NO PARKING"
        const streetCleaningInfo = info.filter(row => 
            String(row?.["sign_description"] ?? "").includes("NO PARKING")
        );
       
        //Populate the street_cleaning database
        for(let i = 0; i < info.length; i++){
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
            let sign_latitude;
            let sign_longitude;

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

                //Convert sign coordinates
                sign_latitude = streetCleaningInfo[i].sign_x_coord;
                sign_longitude = streetCleaningInfo[i].sign_y_coord;
                console.log(streetCleaningInfo[i]);
                //const latNLong = ConvertCoordinatesToLatLong(sign_latitude, sign_longitude);
                //sign_latitude = latNLong.latitude;
                //sign_longitude = latNLong.longitude
                console.log(sign_latitude, sign_longitude);

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