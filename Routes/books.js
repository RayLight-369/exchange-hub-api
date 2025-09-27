const express = require( "express" );
const { prisma } = require( "../lib/prisma" );
const cloudinary = require( "../lib/cloudinary" );
const multer = require( "../middlewares/multer" );
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

router.post( "/", multer.array( "images" ), async ( req, res ) => {
  try {
    const { title, price, subject, ownerId } = req.body;

    const uploadPromises = req.files.map( file => {
      return new Promise( ( resolve, reject ) => {
        cloudinary.uploader.upload_stream(
          { folder: "books" },
          ( error, result ) => {
            if ( error ) reject( error );
            else resolve( result.secure_url );
          }
        ).end( file.buffer );
      } );
    } );

    const imageUrls = await Promise.all( uploadPromises );

    const newBook = await prisma.book.create( {
      data: {
        title,
        price,
        subject,
        images: imageUrls,
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


router.put( "/:id", multer.array( "newImages" ), async ( req, res ) => {
  try {
    const { title, price, subject, keepImages } = req.body;
    const kept = keepImages ? JSON.parse( keepImages ) : [];


    const book = await prisma.book.findUnique( { where: { id: req.params.id } } );
    if ( !book ) return res.status( 404 ).json( { error: "Book not found" } );

    const oldImages = book.images || [];


    const removed = oldImages.filter( ( url ) => !kept.includes( url ) );


    if ( removed.length > 0 ) {
      await Promise.all(
        removed.map( ( url ) => {
          const parts = url.split( "/" );
          const publicIdWithExt = parts.slice( -2 ).join( "/" );
          const publicId = publicIdWithExt.substring(
            0,
            publicIdWithExt.lastIndexOf( "." )
          );
          return cloudinary.uploader.destroy( publicId );
        } )
      );
    }


    let newUrls = [];
    if ( req.files?.length ) {
      const uploadPromises = req.files.map(
        ( file ) =>
          new Promise( ( resolve, reject ) => {
            cloudinary.uploader
              .upload_stream( { folder: "books" }, ( err, result ) =>
                err ? reject( err ) : resolve( result.secure_url )
              )
              .end( file.buffer );
          } )
      );

      newUrls = await Promise.all( uploadPromises );
    }


    const finalImages = [ ...kept, ...newUrls ];


    const updatedBook = await prisma.book.update( {
      where: { id: req.params.id },
      data: {
        title,
        price,
        subject,
        images: finalImages,
      },
    } );

    res.status( 200 ).json( updatedBook );
  } catch ( e ) {
    console.error( e );
    res.status( 500 ).json( { error: "Failed to update book" } );
  }
} );


router.delete( "/:id", async ( req, res ) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findUnique( {
      where: { id },
    } );

    if ( !book ) {
      return res.status( 404 ).json( { message: "Book not found" } );
    }


    if ( book.images && book.images.length > 0 ) {
      const deletePromises = book.images.map( ( url ) => {
        const parts = url.split( "/" );
        const publicIdWithExt = parts.slice( -2 ).join( "/" );
        const publicId = publicIdWithExt.substring(
          0,
          publicIdWithExt.lastIndexOf( "." )
        );

        return cloudinary.uploader.destroy( publicId );
      } );

      await Promise.all( deletePromises );
    }

    await prisma.book.delete( {
      where: { id },
    } );

    res.json( { message: "Book and its images deleted successfully." } );
  } catch ( err ) {
    console.error( err );
    res.status( 500 ).json( { message: "Something went wrong." } );
  }
} );

module.exports = router;
