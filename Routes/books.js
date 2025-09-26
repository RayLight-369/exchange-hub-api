const express = require( "express" );
const { prisma } = require( "../lib/prisma" );
const router = express.Router();


router.get( "/", async ( req, res ) => {
  try {
    const books = await prisma.book.findMany( {
      include: {
        author: true,
      },
    } );

    // return 200 with empty array if no books
    res.status( 200 ).json( books );
  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to fetch books" } );
  }
} );


router.get( "/:id", async ( req, res ) => {
  try {
    const book = await prisma.book.findUnique( {
      where: { id: req.params.id },
      include: {
        author: true,
      },
    } );

    if ( !book ) {
      return res.status( 404 ).json( { error: "Book not found" } );
    }

    res.status( 200 ).json( book );
  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to fetch book" } );
  }
} );

router.post( "/", async ( req, res ) => {
  try {
    const { title, price, subject, ownerId } = req.body;

    const newBook = await prisma.book.create( {
      data: {
        title,
        price,
        subject,
        owner: {
          connect: { id: ownerId },
        }
      },
    } );

    res.status( 201 ).json( newBook );
  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to create book" } );
  }
} );


router.put( "/:id", async ( req, res ) => {
  try {
    const { title, price, subject } = req.body;

    const updatedBook = await prisma.book.update( {
      where: { id: req.params.id },
      data: {
        title,
        price,
        subject,
      },
    } );

    res.status( 200 ).json( updatedBook );
  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to update book" } );
  }
} );


router.delete( "/:id", async ( req, res ) => {
  try {
    const deletedBook = await prisma.book.delete( {
      where: { id: req.params.id },
    } );

    res.status( 200 ).json( { success: true, deletedBook } );

  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to delete book" } );
  }
} );

module.exports = router;
