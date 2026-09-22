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

//Leaflet Map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Functions
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

function findDay(unavailableDay){
    let currentDay = days[getDay()-1];

    //
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
                console.log("Parking is not available");
            }
        }
        else if(result == "NO PARKING ANYTIME"){
            
        }
        else{
            //Street is likely available for parking
        }
    }
}

async function main(){
    await fetchandLoadData();
    displayInfoOnMap();
}

main();