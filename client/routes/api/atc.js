var express    = require('express');
var app        = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());


/*

    Flight:
        "name"
        "take-off time"
        "priority"
        "status"

//*/

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



function Flight( name ) {
    this.id = uuidv4();
    this.name = name;
}

Flight.prototype.getData = function() {
    return {
        "id": this.id,
        "name": this.name
    };
}

function ATCDataHandler( data ) {
    this.data = data;
}

ATCDataHandler.prototype.addFlight = function( flight ) {

    if ( flight instanceof Flight === false ) {
        throw new Error( "Given flight is not an instance of Flight" );
    }

    this.data.flights[ flight.id ] = flight;

}


ATCDataHandler.prototype.deleteFlight = function( flightId ) {
    delete this.data.flights[ flightId ];
}


ATCDataHandler.prototype.getFlight = function( flightId ) {
    return this.data.flights[ flightId ] || false;
}


ATCDataHandler.prototype.getFlights = function() {
    return this.data.flights;
}


const dataHandler = new ATCDataHandler( {
    "flights": {}
} );



/**************************************************************************************************************/
//  Endpoints
/**************************************************************************************************************/


app.get( "/flight", ( req, res ) => {

    res.json( dataHandler.getFlights() );

});


app.post( "/flight", ( req, res ) => {

    if ( !req.body.name ) {
        res.status( 400 ).send( "Invalid/missing flight name" );
    }

    const flight = new Flight( req.body.name );

    dataHandler.addFlight( flight );

    res.status( 201 );

    res.json( flight.getData() );

});


app.delete( "/flight/:flightId", ( req, res ) => {

    const flight = dataHandler.getFlight( req.params.flightId );

    if ( !flight ) {
        res.status( 400 ).send( `Unrecognised flight ID (given: "${req.params.flightId}")` );
    }

    dataHandler.deleteFlight( req.params.flightId );

    res.status( 204 ).send( "" );

});


module.exports = app;