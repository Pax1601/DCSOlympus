var express    = require('express');
var app        = express();

var fs = require('fs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

const allowedTheatres = [
    "caucasus",
    "falklands",
    "marianas",
    "nevada",
    "normandy",
    "persiangulf",
    "sinaimap",
    "syria",
    "thechannel",
    "kola"
];

function getAirbasesData( theatreName ) {
    if ( !isValidTheatre( theatreName ) ) {
        return false;
    }
    
    return JSON.parse( fs.readFileSync( `public/databases/airbases/${theatreName}.json` ) ).airfields
}

function isValidTheatre( theatre ) {
    return ( allowedTheatres.indexOf( theatre ) > -1 )
}

function sendInvalidTheatre( res ) {
    res.status( 400 ).send( "Missing/invalid theatre name; must be one of:\n\t" + allowedTheatres.join( "\n\t" ) );
}

/**************************************************************************************************************/
//  Endpoints
/**************************************************************************************************************/
app.get( "/", ( req, res ) => {
    sendInvalidTheatre( res );
});

app.get( "/:theatreName/:airbaseName", ( req, res ) => {
    const airbases = getAirbasesData( req.params.theatreName );
    if ( !airbases ) {
        sendInvalidTheatre( res );
        return;
    }

    const airbaseName = req.params.airbaseName;
    if ( !airbases.hasOwnProperty( airbaseName ) ) {
        res.status( 404 ).send( `Unknown airbase name "${airbaseName}".  Available options are:\n\t` + Object.keys( airbases ).join( "\n\t" ) );
    } else {
        res.status( 200 ).json( airbases[ airbaseName ] );
    }
});


app.get( "/:theatreName", ( req, res ) => {
    const theatreName = req.params.theatreName.toLowerCase().replace( /\s*/g, "" );
    const airbases    = getAirbasesData( theatreName );

    if ( !airbases ) {
        sendInvalidTheatre( res );
        return;
    }

    res.status( 200 ).json( airbases );
});

module.exports = app;