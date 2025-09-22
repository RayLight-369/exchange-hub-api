// const { prisma } = require( './lib/prisma' );

const express = require( 'express' );
const app = express();
const http = require( "http" );
const server = http.createServer( app );
const bodyParser = require( "body-parser" );
const cors = require( "cors" );
const { prisma } = require( './lib/prisma' );
const AuthRouter = require( './Routes/auth' );
const cookieParser = require( 'cookie-parser' );

app.use( cors( {
  credentials: true,
  origin: "http://localhost:3000"
} ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( cookieParser() );


app.use( "/auth", AuthRouter );


server.listen( process.env.PORT, () => {
  console.log( "Server running." );
} );