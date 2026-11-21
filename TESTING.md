# Testing Instruction
Most testing on the web application is done manually, the main features are tested by having the user interact with the web application. The user is able to start a parking session, cancel a parking session, are finish a parking session, and they're also able to unpark their car. 

## Parking Testing

| Test Case | Test Case Description | Expected Result |
|---|---|---|
| #1 | Start parking session then cancel the parking session| Parking session is cancelled, user is able to start a new parking sesion again |
| #2 | Start parking session then finish the parking session | Data on the streets that the user passed/parked in is stored in the database with a timestamp + day + user id. User is unable to start a new parking session until they unpark their car. |
| #3 | Unparking the car after finishing a parking session | User's parked car data is removed from the database and the user is able to start a new parking session. |
| #4 | There is at least 10 user data on a street where the user passed it around the same time and day of the week | Polyine is displayed on the street to let users know that they might have difficulty parking in that street |
| #5 | User tries to park their car in an area where parking is currently unavailable | Submission is rejected and not stored in the database, user hass to park their car in another location |

## Polyline Creation
| Test Case | Test Case Description | Expected Result |
|---|---|---|
| #1 | User opens the web application | Map sets the view to the user's current location then polylines are displayed on the streets only on streets within the user's current view. |
| #2 | User pans their current view to a different location | Polylines of the new locations are created, polylines already previously loaded in are not loaded again. |
| #3 | Check a street around the time/day where the street is currently unavailable for parking due to street cleaning | Red polyline is created to let the user know that they cannot park their car in the area due to street cleaning |

