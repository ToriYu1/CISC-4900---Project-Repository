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

//Check if the current day matches the day a street will be unavailable for parking
function isMatchingDay(unavailable_days){
    const day = days[getDay() - 1];

    for(let i = 0; i < unavailable_days.length; i++){
        if (day === unavailable_days[i]){
            return true;
        }
    }

    return false;
}

function newConvertTime(time){
    if(time == "NOON"){
        return [12,0];
    }
    else if(time == "MIDNIGHT"){
        return [0,0];
    }
    else{
        let result = time.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)/);
        let hour = result[1];
        let minute = result[2];
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
}

//Check if the current time is between the time of when the street is unavailable
function isMatchingTime(time){
    let currentTime = getTime();
    const startTime = newConvertTime(time[1]);
    const endTime = newConvertTime(time[2]);

    if((currentTime[0] >= startTime[0]) && (currentTime[1] >= startTime[1])){
        if((currentTime[0] <= endTime[0]) && (currentTime[1] <= endTime[1])){
            return true;
        }
    }

    return false;
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
            //(point.latitude + ", " + point.longitude + " -- " + point.latitude2 + ", " + point.longitude2);
        }
        if(point.latitude && point.latitude2 != null){
            if(ids.has(point.order_number)){
                orderNumberSet.delete(point.order_number);
            }
            else{
                let description;
                let createPolyline = false;
                if(point.unavailable_days[0] == "NO PARKING ANYTIME"){
                    console.log("NO PARKING ANYTIME");
                    createPolyline = true;
                    description = "NO PARKING ANYTIME";
                }

                //Check if the street is available for parking 
                if(isMatchingDay(point.unavailable_days)){
                    //Check time
                    if(isMatchingTime(point.time, point.order_number)){
                        console.log("Testing");
                        createPolyline = true;
                    }
                }

                if(createPolyline){
                    console.log("Create polyline");
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
                    console.log("Found day");
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
}

getLocation();
main();

