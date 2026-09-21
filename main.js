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

//Variables
var map = L.map('map').setView([40.7128, -74.0060], 13);
const date = new Date();
const day = date.getDay();
const currentHour = date.getHours();
const currentMinute = date.getMinutes();

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

async function fetchandLoadData(){
    const response = await fetch('https://data.cityofnewyork.us/resource/nfid-uabd.json');
    //const response = await fetch("streetCleaningData.json");
    const data = await response.json();

    for(let i = 0; i < data.length; i++){
        let str = data[i].sign_description;
        if(str.indexOf('NO PARKING') != -1){
            streetCleaningInfo.push(data[i]);
        }
    }
}

function convertTime(time){
    if(time == "NOON") return [12,0];
    else if(time == "MIDNIGHT") return [0,0];

    let result = time.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)/);

    let hour = result[1];
    let minute = result[2];
    let meridiem = result[3];

    if(minute == null){
        minute = 0;
    }

    if(meridiem == "AM"){
        return [hour, minute];
    }
    else if(meridiem == "PM"){
        return [(12 + hour), minute];
    }
}

function findDay(unavailableDay){
    let currentDay = days[day-1];

    if(unavailableDay.length == 1){
        if(unavailableDay[0].includes("-")){
            let d = unavailableDay[0].split("-");
            let startingDay = dayValue[d[0]];
            let endingDay = dayValue[d[1]];

            console.log(startingDay);
            console.log(endingDay);
        }
    }
    for(let i = 0; i < unavailableDay.length; i++){
        if(unavailableDay[i] == currentDay){
            console.log("Unavailable");
            return true;
        }
    }

    return false;
}

function compareDay(str){
    let regex = /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|MON|TUE|WED|THU|FRI|SAT|SUN)(?:\s*(?:-|THRU)\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|MON|TUE|WED|THU|FRI|SAT|SUN))?\b|NO\s+PARKING\s+ANYTIME/gi;
    let unavailableDay = str.match(regex);

    if(unavailableDay == "NO PARKING ANYTIME"){
        return "No Parking";
    }

    let found = findDay(unavailableDay);
}

function compareTime(startTime, endTime){
   //console.log(startTime);
}

function displayInfoOnMap(){
    for(let i = 0; i < streetCleaningInfo.length; i++){
        let str = streetCleaningInfo[i].sign_description;
        let currentDay = days[day-1];

        compareDay(str);
        let wordIndex = str.indexOf(currentDay);
        if(wordIndex == -1){    
            //Street is likely available for parking

            //Check for street traffic data and user-data
        }   
        else{
            //Check to see if parking is soon/already happening
             const result = str.match(/((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))-((?:\d{1,2}(?::\d{2})?(?:AM|PM)|NOON|MIDNIGHT))/i);
             let [startHour, startMinute] = convertTime(result[1]);

             //console.log(startHour);
             //console.log(startMinute);
        }
    }
}

async function main(){
    await fetchandLoadData();
    displayInfoOnMap();
}

main();