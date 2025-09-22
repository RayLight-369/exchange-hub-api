const express = require( 'express' );
const { prisma } = require( '../lib/prisma' );
const router = express.Router();
const jwt = require( "jsonwebtoken" );
const bcrypt = require( "bcryptjs" );

const JWT_SECRET = process.env.jwtsecret;

router.post( "/signup", async ( req, res ) => {
  const body = req.body;
  console.log( body );
  try {

    const newUser = await prisma.user.create( {
      data: {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      },
    } );

    const { password, ...data } = newUser;

    res.json( data );

  } catch ( error ) {
    console.log( error );
  }
} );

router.post( "/signin", async ( req, res ) => {
  const body = req.body;
  console.log( body );
  try {

    const user = await prisma.user.findUnique( {
      where: {
        email: req.body.email,
        password: req.body.password,
      },
    } );

    const { password, ...data } = user;

    const token = jwt.sign( { id: user.id }, JWT_SECRET, { expiresIn: "7d" } );

    // Set HttpOnly cookie
    res.cookie( "token", token, {
      httpOnly: true,
      secure: true, // true on prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    } );

    res.json( data );

  } catch ( error ) {
    console.log( error );
  }
} );

router.get( "/me", async ( req, res ) => {
  const token = req.cookies.token;
  if ( !token ) return res.status( 401 ).json( { message: "Not authenticated" } );

  try {
    const decoded = jwt.verify( token, JWT_SECRET );
    const user = await prisma.user.findUnique( {
      where: {
        id: decoded.id,
      },
    } );

    const { password, ...data } = user;

    res.json( data );
  } catch ( err ) {
    res.status( 401 ).json( { message: "Invalid token" } );
  }
} );

router.post( "/signout", ( req, res ) => {
  res.clearCookie( "token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" } );
  res.json( { message: "Signed out successfully" } );
} );

module.exports = router;