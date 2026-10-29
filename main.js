//Arrays
let streetCleaningInfo = [];
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const dayValue = {
    "MONDAY": 0,
    "TUESDAY": 1,
    "WEDNESDAY": 2,
    "THURSDAY": 3,
    "FRIDAY": 4,
    "SATURDAY": 5,
    "SUNDAY": 6
}

//Dictionary
const ids = new Map();

//Config
let importStreetCleaningData = false;
let importCenterlineData = false;
let editStreetCleaningData = false;
let zoomLimit;

//Variables
var map = L.map('map', {minZoom: 16, maxZoom: 18, zoom: 18}).setView([40.7128, -74.0060], 13);
const epsg2263 = "+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs'";

//Leaflet Map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Functions
function getLocation(){
    if("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                map.setView([latitude, longitude], 16);
            },

            (error) => {
                switch(error.code){
                    case error.PERMISSION_DENIED: //User did not give permission to use geolocation, use IP instead
                        fetch("https://ipapi.co/json/")
                            .then((response) => response.json())
                            .then((data) => {
                                const latitude = data.latitude;
                                const longitude = data.longitude;
                                map.setView([latitude, longitude], 16);
                            });
                        break;
                }
            }
        );
    }
}

function ConvertCoordinatesToLangLat(x,y){
    let x1 = parseFloat(x);
    let y1 = parseFloat(y);

    const [long, lat] = proj4(epsg2263, "EPSG:4326", [x1,y1]);
    return {lattitude: lat, longitude: long};
}

function getDate(){
    return new Date();
}

function getDay(){
    let date = getDate();
    let day = date.getDay();

    return day;
}

function getTime(){
    let date = getDate();
    let hour = date.getHours();
    let minute = date.getUTCMinutes();

    return [hour,minute];
}

async function loadStreetCleaningData(bounds) {
    console.log("Loading street cleaning data");
    const minLatitude = bounds.getSouth();
    const maxLatitude = bounds.getNorth();
    const minLongitude = bounds.getWest();
    const maxLongitude = bounds.getEast();

    const response = await fetch(`http://localhost:3000/getStreetCleaningData?minLatitude=${minLatitude}&maxLatitude=${maxLatitude}&minLongitude=${minLongitude}&maxLongitude=${maxLongitude}`);
    const data = await response.json();

    let orderNumberSet = new Set(ids.keys());
    data.forEach(point => {
        if (point.order_number ===  "S-01482352") {
            console.log("BUTLER street coords: " + point.latitude + ", " + point.longitude + " -- " + point.latitude2 + ", " + point.longitude2);
            console.log(point.latitude && point.latitude2 != null);
            console.log("Matched to BUTLER ST!")
        }
        else{
            console.log(point.latitude + ", " + point.longitude + " -- " + point.latitude2 + ", " + point.longitude2);
        }
        if(point.latitude && point.latitude2 != null){
            if(ids.has(point.order_number)){
                orderNumberSet.delete(point.order_number);
            }
            else{
                const latnLong = [
                    [point.latitude, point.longitude],
                    [point.latitude2, point.longitude2]
                ]

                let polyline = L.polyline(latnLong, {
                    color: '#a92727',
                    weight: 5,
                    opacity: 0.5
                })
                polyline.addTo(map);

                ids[point.order_number] = polyline;
            }
        }
    })

    for(const orderNumber of orderNumberSet){
        let polyline = ids[orderNumber];
        polyline.remove();
        map.removeLayer(polyline);
        ids.delete(orderNumber);
    }
}

async function fetchandLoadData(){
    //Testing polyline
    const latnLong = [
        [40.684186554855,  -73.992192911393],
        [40.683551945806, -73.992624221058]
    ]
   
    L.polyline(latnLong, {
        color: 'blue',
        weight: 100,
        opacity: 1
    }).addTo(map);
    console.log('Fetch data');

    const centerlineResponse = await fetch('./centerline.csv');
    const centerlineData = await centerlineResponse.text();

    //Import data into tables in database
    if(importCenterlineData == true){
        await fetch("http://localhost:3000/importCenterlineData",{
            method: "POST",
            headers: {
            "Content-Type": "text/csv"
        },
        body: centerlineData
        });
    }

    if(importStreetCleaningData == true){
        const response = await fetch('./streetCleaning.json');
        const data = await response.json();

        const response2 = await fetch("http://localhost:3000/import",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    }

    if(editStreetCleaningData == true){
        const response = await fetch("http://localhost:3000/editStreetCleaning",{
            method: "POST",
        });
    }
  
    map.on("moveend", function(){
        const bounds = map.getBounds();
        loadStreetCleaningData(bounds);
    })
    
}

function findDay(unavailableDay){
    let currentDay = days[getDay()-1];

    if(unavailableDay.length == 1){
        if(unavailableDay[0].includes("-")){
            let d = unavailableDay[0].split("-");
            let startingDay = dayValue[d[0]];
            let endingDay = dayValue[d[1]];
            let numDays = Math.abs(startingDay - endingDay);
            
            for(let i = 0; i <= numDays; i++){
                if(currentDay == days[startingDay + i]){
                    return true;
                }
            }

            return false;
        }
    }

    for(let i = 0; i < unavailableDay.length; i++){
        if(unavailableDay[i] == currentDay){
            return true;
        }
    }

    return false;
}

function isMatchingDay(str){
    let regex = /\b(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN)(?:\s*(?:-|THRU)\s*(?:MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|WED|THU|FRI|SAT|SUN))?\b|NO\s+PARKING\s+ANYTIME/gi;
    let unavailableDay = str.match(regex);

    if(unavailableDay == "NO PARKING ANYTIME"){
        return "NO PARKING ANYTIME";
    }

    let found = findDay(unavailableDay);
    if(found == true){
        return true;
    }
    else{
        return false;
    }
}

function convertTime(time){
    if(time == "NOON") return [12,0];
    else if(time == "MIDNIGHT") return [0,0];

    let result = time.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)/);

    let hour = Number(result[1]);
    let minute = Number(result[2]) || 0;
    let meridiem = result[3];

    if(meridiem == "AM"){
        return [hour, minute];
    }
    else if(meridiem == "PM"){
        if(hour == 12){
            return [hour, minute];
        }
        else{
            return [hour + 12, minute];
        }
    }
}

function isMatchingTime(startTime, endTime){
    let currentTime = getTime();
    let hour = currentTime[0];
    let minute = currentTime[1];

    let startTimeInfo = convertTime(startTime);
    let endTimeInfo = convertTime(endTime);

    let startHour = startTimeInfo[0];
    let startMinute = startTimeInfo[1];
    let endHour = endTimeInfo[0];
    let endMinute = endTimeInfo[1];

    if(hour >= startHour && hour <= endHour){
        //Parking is not available
        return true;
    }
    else{
        return false;
    }
}

function displayInfoOnMap(){
    for(let i = 0; i < streetCleaningInfo.length; i++){
        let str = streetCleaningInfo[i].sign_description;

        let result = isMatchingDay(str);
        if(result == true){
            //Street is likely unavailable for parking

            //Check time/date
            const timeResult = str.match(/((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))-((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))/i);
            if(isMatchingTime(timeResult[1], timeResult[2]) == true){
                //Street is currently being cleaned, parking is unavaialble

            }
            else{
                //Street is not being cleaned at this time, parking is possibly available
                let testX = streetCleaningInfo[i].sign_x_coord;

                if(testX != undefined){
                    let latNLong = ConvertCoordinatesToLangLat(streetCleaningInfo[i].sign_x_coord, streetCleaningInfo[i].sign_y_coord);   
                    let marker = L.marker([latNLong.lattitude, latNLong.longitude]).addTo(map);
                    marker.bindPopup("Parking is possibly available");
                }  
            }
        }
        else if(result == "NO PARKING ANYTIME"){
            let testX = streetCleaningInfo[i].sign_x_coord;

            if(testX != undefined){
                let latNLong = ConvertCoordinatesToLangLat(streetCleaningInfo[i].sign_x_coord, streetCleaningInfo[i].sign_y_coord);   
                let marker = L.marker([latNLong.lattitude, latNLong.longitude]).addTo(map);
                marker.bindPopup("Parking is unavailable");
            }
        }
        else{
            //Street is likely available for parking
            let testX = streetCleaningInfo[i].sign_x_coord;

            if(testX != undefined){
                let latNLong = ConvertCoordinatesToLangLat(streetCleaningInfo[i].sign_x_coord, streetCleaningInfo[i].sign_y_coord);   
                let marker = L.marker([latNLong.lattitude, latNLong.longitude]).addTo(map);
                marker.bindPopup("Parking is possibly available");
            }
        }
    }
}

//UI
const checkboxes = document.querySelectorAll(".day");
checkboxes.forEach(checkbox =>{
    checkbox.addEventListener("change", function(){
       if(this.checked){

       }
    })
})


async function main(){
    await fetchandLoadData();
    displayInfoOnMap();
}

getLocation();
main();

