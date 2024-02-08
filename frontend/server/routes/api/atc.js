var express = require('express');
var app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function Flight(name, boardId, unitId) {
    this.assignedAltitude = 0;
    this.assignedSpeed = 0;
    this.id = uuidv4();
    this.boardId = boardId;
    this.name = name;
    this.status = "unknown";
    this.takeoffTime = -1;
    this.unitId = parseInt(unitId);
}

Flight.prototype.getData = function () {
    return {
        "assignedAltitude": this.assignedAltitude,
        "assignedSpeed": this.assignedSpeed,
        "id": this.id,
        "boardId": this.boardId,
        "name": this.name,
        "status": this.status,
        "takeoffTime": this.takeoffTime,
        "unitId": this.unitId
    };
}

Flight.prototype.setAssignedAltitude = function (assignedAltitude) {

    if (isNaN(assignedAltitude)) {
        return "Altitude must be a number"
    }

    this.assignedAltitude = parseInt(assignedAltitude);

    return true;

}

Flight.prototype.setAssignedSpeed = function (assignedSpeed) {

    if (isNaN(assignedSpeed)) {
        return "Speed must be a number"
    }

    this.assignedSpeed = parseInt(assignedSpeed);

    return true;

}

Flight.prototype.setOrder = function (order) {

    this.order = order;

    return true;

}

Flight.prototype.setStatus = function (status) {

    if (["unknown", "checkedin", "readytotaxi", "clearedtotaxi", "halted", "terminated"].indexOf(status) < 0) {
        return "Invalid status";
    }

    this.status = status;

    return true;

}

Flight.prototype.setTakeoffTime = function (takeoffTime) {

    if (takeoffTime === "" || takeoffTime === -1) {
        this.takeoffTime = -1;
    }

    if (isNaN(takeoffTime)) {
        return "Invalid takeoff time"
    }

    this.takeoffTime = parseInt(takeoffTime);

    return true;

}

function ATCDataHandler(data) {
    this.data = data;
}

ATCDataHandler.prototype.addFlight = function (flight) {

    if (flight instanceof Flight === false) {
        throw new Error("Given flight is not an instance of Flight");
    }

    this.data.flights[flight.id] = flight;

}

ATCDataHandler.prototype.deleteFlight = function (flightId) {
    delete this.data.flights[flightId];
}

ATCDataHandler.prototype.getFlight = function (flightId) {
    return this.data.flights[flightId] || false;
}

ATCDataHandler.prototype.getFlights = function () {
    return this.data.flights;
}

const dataHandler = new ATCDataHandler({
    "flights": {}
});

/**************************************************************************************************************/
//  Endpoints
/**************************************************************************************************************/
app.get("/flight", (req, res) => {

    let flights = Object.values(dataHandler.getFlights());

    if (flights && req.query.boardId) {

        flights = flights.reduce((acc, flight) => {
            if (flight.boardId === req.query.boardId) {
                acc[flight.id] = flight;
            }
            return acc;
        }, {});

    }

    res.json(flights);

});


app.patch("/flight/:flightId", (req, res) => {

    const flightId = req.params.flightId;
    const flight = dataHandler.getFlight(flightId);

    if (!flight) {
        res.status(400).send(`Unrecognised flight ID (given: "${req.params.flightId}")`);
    }

    if (req.body.hasOwnProperty("assignedAltitude")) {

        const altitudeChangeSuccess = flight.setAssignedAltitude(req.body.assignedAltitude);

        if (altitudeChangeSuccess !== true) {
            res.status(400).send(altitudeChangeSuccess);
        }

    }

    if (req.body.hasOwnProperty("assignedSpeed")) {

        const speedChangeSuccess = flight.setAssignedSpeed(req.body.assignedSpeed);

        if (speedChangeSuccess !== true) {
            res.status(400).send(speedChangeSuccess);
        }

    }

    if (req.body.status) {

        const statusChangeSuccess = flight.setStatus(req.body.status);

        if (statusChangeSuccess !== true) {
            res.status(400).send(statusChangeSuccess);
        }

    }

    if (req.body.hasOwnProperty("takeoffTime")) {

        const takeoffChangeSuccess = flight.setTakeoffTime(req.body.takeoffTime);

        if (takeoffChangeSuccess !== true) {
            res.status(400).send(takeoffChangeSuccess);
        }

    }

    res.json(flight.getData());

});


app.post("/flight/order", (req, res) => {

    if (!req.body.boardId) {
        res.status(400).send("Invalid/missing boardId");
    }

    if (!req.body.order || !Array.isArray(req.body.order)) {
        res.status(400).send("Invalid/missing boardId");
    }

    req.body.order.forEach((flightId, i) => {

        dataHandler.getFlight(flightId).setOrder(i);

    });

    res.send("");

});


app.post("/flight", (req, res) => {

    if (!req.body.boardId) {
        res.status(400).send("Invalid/missing boardId");
    }

    if (!req.body.name) {
        res.status(400).send("Invalid/missing flight name");
    }

    if (!req.body.unitId || isNaN(req.body.unitId)) {
        res.status(400).send("Invalid/missing unitId");
    }

    const flight = new Flight(req.body.name, req.body.boardId, req.body.unitId);

    dataHandler.addFlight(flight);

    res.status(201);

    res.json(flight.getData());

});


app.delete("/flight/:flightId", (req, res) => {

    const flight = dataHandler.getFlight(req.params.flightId);

    if (!flight) {
        res.status(400).send(`Unrecognised flight ID (given: "${req.params.flightId}")`);
    }

    dataHandler.deleteFlight(req.params.flightId);

    res.status(204).send("");

});


module.exports = app;