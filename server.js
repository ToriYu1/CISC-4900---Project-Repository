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
    let x1 = parseFloat(x);
    let y1 = parseFloat(y);

    const [long, lat] = proj4(epsg2263, "EPSG:4326", [x1,y1]);
    return {longitude: long, latitude: lat};
}


app.use(cors());
app.use(express.json({limit: '500mb'}));
app.use(express.text({type: "text/csv", limit: '500mb'}));

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

app.post('/importCenterlineData', async (req, res) => {
    const info = req.body.split("\n");
    try{
        console.log("Import coordinates");
        for(let i = 1; i < info.length; i++){
            const the_geom = info[i].match(/MULTILINESTRING \(\((.*?)\)\)/);
            if(the_geom){
                let coordinateString = the_geom[1];
                let str = coordinateString
                    .replace(/[()]/g, "")
                    .split(",").map(x => x.trim().split(/\s+/).map(Number));

                const query = await pool.query(
                    `INSERT INTO centerline_data (coordinates)
                        VALUES ($1)
                        `, [str]     
                );
            }
        }
        console.log("Finished importing coordinates");
    } catch(error){
        console.log(error.message);
    }
})

//Import data into street_cleaning database
app.post('/import', async (req, res) => {
    const info = req.body;

    try{
        //Filter data to only get the tables where sign_description mentions "NO PARKING"
        console.log("Import street cleaning data");
        const streetCleaningInfo = info.filter(row => 
            String(row?.["sign_description"] ?? "").includes("NO PARKING")
        );
       
        //Populate the street_cleaning database
        for(let i = 0; i < streetCleaningInfo.length; i++){
            const str = streetCleaningInfo[i].sign_description
            const order_number = streetCleaningInfo[i].order_number;
          
            //Check if order_number already exists in the database
            const result = await pool.query(
                "SELECT EXISTS (SELECT 1 FROM street_cleaning WHERE order_number = $1) AS exists",
                [order_number]
            );

            //order_number already exists in the database, skip to next data
            if(result.rows[0].exists){ 
                continue
            }

            let sign_longitude = streetCleaningInfo[i].sign_x_coord;
            let sign_latitude = streetCleaningInfo[i].sign_y_coord;

            //sign_longitude/sign_latitude is empty, search for the value by looking at other data containign the same order_number
            if(sign_longitude == "" || sign_latitude == ""){
                const result = info.find(row =>
                    row.order_number = order_number && row.sign_x_coord != "" && row.sign_y_coord != ""
                )
                sign_longitude = result.sign_x_coord;
                sign_latitude = result.sign_y_coord;
            }

            //Convert Coordinates
            const latNLong = ConvertCoordinatesToLatLong(sign_longitude, sign_latitude);
            sign_longitude = latNLong.longitude
            sign_latitude = latNLong.latitude;

            const unavailableDays = str.match(/NO\s+PARKING\s+ANYTIME|NO\s+PARKING(?!.*\b(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|TUES|WED|THU|THURS|FRI|SAT|SUN)\b)|(?<=NO\s+PARKING.*)\b(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|TUES|WED|THU|THURS|FRI|SAT|SUN)(?:\s*(?:-|THRU)\s*(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|TUES|WED|THU|THURS|FRI|SAT|SUN))?\b/gi);
            const time = str.match(/((?:\d{1,2}(?::\d{2})?(?:AM|PM)?|NOON|MIDNIGHT))(?:\s*-\s*|\s+TO\s+|\s+)((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))/i);
            const side = streetCleaningInfo[i].side_of_street;
            const borough = streetCleaningInfo[i].borough;
            const fromStreet = streetCleaningInfo[i].from_street;
            const toStreet = streetCleaningInfo[i].to_street;
            const onStreet = streetCleaningInfo[i].on_street;

            const query = await pool.query(
                `INSERT INTO street_cleaning (order_number, sign_longitude, sign_latitude, unavailable_days, time, side, borough, from_street, to_street, on_street)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [order_number, sign_longitude, sign_latitude, unavailableDays, time, side, borough, fromStreet, toStreet, onStreet]     
            );
        }

        console.log('Finished importing street cleaning data');
        res.json({
            success: true}
        );
    }
    catch(error){
        console.log(error.message);
    }
})

app.listen(PORT, () => {
    console.log("Server is now running...");
})