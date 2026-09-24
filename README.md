# Parking Tracker

Parking Tracker is a web application that helps drivers in New York find parking spots by suggesting streets that are likely available for parking. Parking availability is determined through user-submitted data, street traffic data, and data on when and where street cleaning occurs.

## Planned Features:
- A map that displays information about what streets are possibly available/unavailable for parking, green = possibly available, red = not available. 
- Users will be able to submit data anonymously on locations that they've parked/unparked in. This information will be available to other users.
- Users can filter the data by day of the week to see what days street cleaning will occur on a certain street, allowing them to plan ahead. Users may also be able to filter out parking spots that require a parking fee.
- Reminder feature to remind users to move their car before street cleaning happens

## Libraries
- [Leaflet](https://github.com/leaflet/Leaflet) 
- [proj4js](https://github.com/proj4js/proj4js) 

## Data
- [Street Cleaning Schedule](https://data.cityofnewyork.us/resource/nfid-uabd.json)