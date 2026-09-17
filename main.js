//Arrays
let streetCleaningInfo = [];
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

//Variables
var map = L.map('map').setView([40.7128, -74.0060], 13);
const date = new Date();
const day = date.getDay();
const time = date.getTime();

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

async function fetchandLoadData(){
    const response = await fetch('https://data.cityofnewyork.us/resource/nfid-uabd.json');
    const data = await response.json();

    for(let i = 0; i < data.length; i++){
        let str = data[i].sign_description;
        if(str.indexOf('NO PARKING')){
            streetCleaningInfo.push(data[i]);
        }
    }
}

function displayInfoOnMap(){
    for(let i = 0; i < streetCleaningInfo.length; i++){
       let str = streetCleaningInfo[i].sign_description;
       let dayString = days[day];

       let wordIndex = str.indexOf("MONDAY"); //Temp
       if(wordIndex != -1){
            //Check the current time and compare it with the scheduled time for cleaning, if it's a few befores before cleaning hours parking will be unavailable

            console.log("Parking is likely not available");
       }
       else{
        console.log("Parking is likely available");
       }
    }
}

async function main(){
    await fetchandLoadData();
    displayInfoOnMap();
}

main();