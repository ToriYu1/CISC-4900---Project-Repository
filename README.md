# Parking Tracker

Parking Tracker is a web application that helps drivers in New York find parking spots by suggesting streets that are likely available for parking. Parking availability is determined through user-submitted data, street traffic data, and data on when and where street cleaning occurs.

## Planned Features:
- A map that displays information about what streets are possibly available/unavailable for parking, streets that are currently unavailable for parking will be marked in red.
- Users will be able to submit data anonymously on locations that they've parked/unparked in. This information will be available to other users.
- Reminder feature to remind users to move their car before street cleaning happens

## Optional Features (Might be added)
- Users can filter the data by day of the week to see what days street cleaning will occur on a certain street, allowing them to plan ahead. Users may also be able to filter out parking spots that require a parking fee.
- Recommended parking spot feature, suggest a location for the user to park at based on the least busiest street and time (If a spot will become unavailable for parking soon the spot won’t be recommended)
- Parking fee data to let users know if a street requires them to pay a parking fee to park in

## Libraries
- [Leaflet](https://github.com/leaflet/Leaflet) 
- [proj4js](https://github.com/proj4js/proj4js) 

## Data
- [New York Parking Regulations](https://data.cityofnewyork.us/Transportation/Parking-Regulation-Locations-and-Signs/nfid-uabd/data_preview)
- [Centerline](https://data.cityofnewyork.us/City-Government/Centerline/inkn-q76z/data_preview)

## User Data & Privacy
- The web application uses the user's location to better enhance the user's experience on the website. With access to the user's location the site is able to auomatically zoom into the area the user is currently at on the map, this allows the user to quickly access information on what streets around them are available/unavailable for parking in their surrounding area. The site requests for the user's permission to use their geolocation, if the user does not accept the request their IP address will be used instead. The site does not store this information anywhere. 
- Users are able to submit data on where they parked a car by using their email address, the email address and the location of where the car was parked are both stored into a database. With the stored information other users of the app will be able to know if someone has parked their car in an area, information on the user is kept anonymous, other users are only able to see if a car is parked in an area. The user’s email address is used for future verification, if the user wants to be able to unpark from a location they must use the email address they used to submit the data. 

NOTE: The project may collect data on something else from the user to verify their identity instead of email addresses, but currently the plan is to use their email address.

## Constraints
- The dataset used for the project is limited to New York, making the web application useful for only those living in New York / plan to drive to New York.