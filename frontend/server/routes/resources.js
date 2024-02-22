const express = require('express');
const sharp = require('sharp')
const fs = require('fs');
const pfs = require('fs/promises')
const router = express.Router();

router.get('/theme/*', function (req, res, next) {
    var reqTheme = "olympus";
    
    /* Yes, this in an easter egg! :D Feel free to ignore it, or activate the parrot theme to check what it does. Why parrots? The story is a bit long, come to the Discord and ask :D */
    if (reqTheme === "parrot" && !req.url.includes(".css"))
        res.redirect('/themes/parrot/images/parrot.svg');
    else
        res.redirect(req.url.replace("theme", "themes/" + reqTheme));
});

router.put('/theme/:newTheme', function (req, res, next) {
    res.end("Ok");
});

router.get('/maps/:map/:z/:x/:y.png', async function (req, res, next) {
    let map = req.params.map;
    let x = req.params.x;
    let y = req.params.y;
    let z = req.params.z;

    if (fs.existsSync(`.\\public\\maps\\${map}`)) {
        if (!await renderImage(map, z, x, y, res)) {
            /* No image was found */
            res.sendStatus(404);
        }
    } else {
        /* The requested map does not exist */
        res.sendStatus(404);
    }    
});

async function renderImage(map, z, x, y, res, recursionDepth = 0) {
    if (recursionDepth == 20) {
        console.log("Render image, maximum recursion depth reached")
        /* We have reached limit recusion depth, something went wrong */
        return false;
    }
    /* If the requested image exists, send it straight away */
    if (fs.existsSync(`.\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`)) {
        res.sendFile(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);
        return true;
    } else {
        /* If the requested image doesn't exist check if there is a "source" tile at a lower zoom level we can split up */
        let sourceZoom = z - 1;
        let sourceX = Math.floor(x / 2);
        let sourceY = Math.floor(y / 2);

        /* Keep decreasing the zoom level until we either find an image or reach maximum zoom out and must return false */
        while (sourceZoom >= 0) {
            /* We have found a possible source image */
            if (fs.existsSync(`.\\public\\maps\\${map}\\${sourceZoom}\\${sourceX}\\${sourceY}.png`)) {
                /* Split the image into four. We can retry up to 10 times to clear any race condition on the files */
                let retries = 10;
                while (!await splitTile(map, sourceZoom, sourceX, sourceY) && retries > 0) {
                    await new Promise(r => setTimeout(r, 1000));
                    retries--;
                }
                /* Check if we exited because we reached the maximum retry value */
                if (retries != 0) {
                    /* Recursively recall the function now that we have a new "source" image */
                    return await renderImage(map, z, x, y, res, recursionDepth + 1);
                } else {
                    return false;
                }
            } else {
                /* Keep searching at a higher level */
                sourceZoom = sourceZoom - 1;
                sourceX = Math.floor(sourceX / 2);
                sourceY = Math.floor(sourceY / 2);
            }
        }
        return false;
    }
}

async function splitTile(map, z, x, y) {
    try {
        /* Load the source image */
        let img = sharp(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);

        /* Create the necessary folders */
        await pfs.mkdir(`${process.cwd()}\\public\\maps\\${map}\\${z + 1}\\${2*x}`, { recursive: true })
        await pfs.mkdir(`${process.cwd()}\\public\\maps\\${map}\\${z + 1}\\${2*x + 1}`, { recursive: true })

        /* Split the image into four parts */
        await resizePromise(img, 0,     0,      map, z + 1, 2 * x,      2 * y);
        img = sharp(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);
        await resizePromise(img, 128,   0,      map, z + 1, 2 * x + 1,  2 * y);
        img = sharp(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);
        await resizePromise(img, 0,     128,    map, z + 1, 2 * x,      2 * y + 1);
        img = sharp(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);
        await resizePromise(img, 128,   128,    map, z + 1, 2 * x + 1,  2 * y + 1);
        return true;
    } catch (err) {
        if (err.code !== 'EBUSY') {
            console.error(err);
        }
        return false;
    }
}

/* Returns a promise, extracts a 128x128 pixel chunk from an image, resizes it to 256x256, and saves it to file */
function resizePromise(img, left, top, map, z, x, y) {
    return new Promise((res, rej) => {
        if (fs.existsSync(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`)) {
            res(true);
        } 
        img.extract({ left: left, top: top, width: 128, height: 128 }).resize(256, 256).toFile(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.temp.png`, function (err) {
            if (err) {
                rej(err);
            } else {
                try {
                    fs.renameSync(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.temp.png`, `${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`);
                } catch (err) {
                    if (err.code === 'EBUSY') {
                        /* The resource is busy, someone else is writing or renaming it. Reject the promise so we can try again */
                        rej(err);
                    } else if (err.code === 'ENOENT') {
                        /* Someone else renamed the file already so this is not a real error */
                        if (fs.existsSync(`${process.cwd()}\\public\\maps\\${map}\\${z}\\${x}\\${y}.png`)) {
                            res(true);
                        }
                        /* Something odd happened, reject and try again */
                        else {
                            rej(err);
                        }
                    } else {
                        rej(err);
                    }
                }
                res(true)
            }
        });
    })    
}

module.exports = router;
