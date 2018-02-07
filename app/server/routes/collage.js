import * as db from "../db";
import HTTPError from 'node-http-error';
import * as crypto from '../helpers/crypto';
import { createCanvas, loadImage } from 'canvas';
import NodeCache from "node-cache";
import StreamBuffer from 'stream-buffers';
import promisePipe from 'promisepipe';

const imageCache = new NodeCache();

export const router = require('express-promise-router')();

function invalidateCache(url_name) {
    imageCache.del(url_name + " 4chan");
    imageCache.del(url_name + " png");
    imageCache.del(url_name + " jpeg");
}

router.get('/:url_name/4chan', async (req, res) => {
    let collage;
    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if (rows.length === 0) throw new HTTPError(404);

        collage = rows[0];
    }

    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.4chan.jpg"`);
    let image;
    if(image = imageCache.get(collage.url_name + " 4chan")) {
        return res.send(image);
    }

    let images;
    {
        const {rows} = await db.query(`
            SELECT images.* 
            FROM images 
            JOIN collages ON images.collages_id = collages.id
            WHERE url_name = $1`, [req.params.url_name]);

        images = rows;
    }

    const fullWidth = collage.img_width * collage.columns;
    const fullHeight = collage.img_height * collage.rows;
    let width = fullWidth;
    let height = fullHeight;

    if(width > 10000) {
        width = 10000;
        height = height * (width / fullWidth)
    }
    if(height > 10000) {
        height = 10000;
        width = width * (height / fullHeight)
    }

    let img_width = Math.floor(width / collage.columns);
    let img_height = Math.floor(height / collage.rows);

    width = img_width * collage.columns;
    height = img_height * collage.rows;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    await Promise.all(images.filter(img => img.posx !== null && img.posy !== null)
        .map(image => loadImage(image.data)
            .then(loaded => {
                ctx.drawImage(loaded, image.posx * img_width, image.posy * img_height, img_width * image.columns, img_height * image.rows);
            })));


    let quality = 100 + 5;
    let buffer;
    let n = 0;
    do {
        quality -= 5;
        n++;
        const streamBuffer = new StreamBuffer.WritableStreamBuffer();
        await promisePipe(canvas.jpegStream({quality}), streamBuffer);
        buffer = streamBuffer.getContents();
        console.log(`Try ${n}: q=${quality/100} size=${Math.floor(buffer.length/10)/100}`)
    } while(buffer.length > 4194304);

    imageCache.set(collage.url_name + " 4chan", buffer, 60 * 60);

    res.send(buffer);
});

router.get('/:url_name/jpeg', async (req, res) => {
    let collage;
    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if (rows.length === 0) throw new HTTPError(404);

        collage = rows[0];
    }

    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.jpg"`);
    let image;
    if(image = imageCache.get(collage.url_name + " jpeg")) {
        return res.send(image);
    }

    let images;
    {
        const {rows} = await db.query(`
            SELECT images.* 
            FROM images 
            JOIN collages ON images.collages_id = collages.id
            WHERE url_name = $1`, [req.params.url_name]);

        images = rows;
    }

    const canvas = createCanvas(collage.img_width * collage.columns, collage.img_height * collage.rows);
    const ctx = canvas.getContext('2d');

    await Promise.all(images.filter(img => img.posx !== null && img.posy !== null)
        .map(image => loadImage(image.data)
            .then(loaded => {
                ctx.drawImage(loaded, image.posx * collage.img_width, image.posy * collage.img_height);
            })));

    const streamBuffer = new StreamBuffer.WritableStreamBuffer();
    await promisePipe(canvas.jpegStream(), streamBuffer);
    const buffer = streamBuffer.getContents();

    imageCache.set(collage.url_name + " jpeg", buffer, 60 * 60);

    res.send(buffer);
});

router.get('/:url_name/png', async (req, res) => {
    let collage;
    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if (rows.length === 0) throw new HTTPError(404);

        collage = rows[0];
    }

    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.png"`);
    let image;
    if(image = imageCache.get(collage.url_name + " png")) {
        return res.send(image);
    }

    let images;
    {
        const {rows} = await db.query(`
            SELECT images.* 
            FROM images 
            JOIN collages ON images.collages_id = collages.id
            WHERE url_name = $1`, [req.params.url_name]);

        images = rows;
    }

    const canvas = createCanvas(collage.img_width * collage.columns, collage.img_height * collage.rows);
    const ctx = canvas.getContext('2d');

    await Promise.all(images.filter(img => img.posx !== null && img.posy !== null)
        .map(image => loadImage(image.data)
            .then(loaded => {
                ctx.drawImage(loaded, image.posx * collage.img_width, image.posy * collage.img_height);
            })));

    const streamBuffer = new StreamBuffer.WritableStreamBuffer();
    await promisePipe(canvas.pngStream(), streamBuffer);
    const buffer = streamBuffer.getContents();

    imageCache.set(collage.url_name + " png", buffer, 60 * 60);

    res.send(buffer);
});

router.patch('/:url_name/image/:id', async (req, res) => {
    const initialData = {};

    if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);

    invalidateCache(req.params.url_name);

    const {rows} = await db.query(`
        UPDATE images
        SET posx = $1, posy = $2
        WHERE id = $3
        RETURNING *`,
        [req.body.posx, req.body.posy, req.params.id]);
    if(rows.length === 0) throw new HTTPError(404);

    initialData.image = rows[0];
    delete initialData.image.collages_id;

    broadcastToLive(req.params.url_name, {
        updateImage: initialData.image
    });

    res.json(initialData);
});

router.delete('/:url_name/image/:id', async (req, res) => {
    const initialData = {};

    if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);

    invalidateCache(req.params.url_name);

    const {rows} = await db.query(`
        DELETE FROM images
        WHERE id = $1
        RETURNING 1`,
        [req.params.id]);
    if(rows.length === 0) throw new HTTPError(404);

    broadcastToLive(req.params.url_name, {
        removeImage: req.params.id
    });

    res.json(initialData);
});

router.post('/:url_name/image', async (req, res) => {
    const initialData = {};

    if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);

    const {rows} = await db.query(`
        INSERT INTO images(collages_id, source_url, data, posx, posy, rows, columns)
        SELECT collages.id, $1, $2, $3, $4, $5, $6
        FROM collages
        WHERE url_name = $7
        RETURNING *`,
        [req.body.source_url, req.body.data, req.body.posx, req.body.posy, req.body.rows, req.body.columns, req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);

    initialData.image = rows[0];
    delete initialData.image.collages_id;

    broadcastToLive(req.params.url_name, {
        newImage: initialData.image
    });

    res.json(initialData);
});

router.post('/:url_name/update', async (req, res) => {
    const initialData = {};

    if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);

    invalidateCache(req.params.url_name);

    const {rows} = await db.query(`
        UPDATE collages 
        SET name = $1, rows = $2, columns = $3, 
            img_width = $4, img_height = $5 
        WHERE url_name = $6
        RETURNING *`,
        [req.body.name, req.body.rows, req.body.columns, req.body.img_width, req.body.img_height, req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);

    const collage = rows[0];
    delete collage.password;

    if(req.body.resetImages) {
        await db.query(`DELETE FROM images WHERE collages_id = $1`, [rows[0].id]);
    } else {
        const {rows} = await db.query(`
            UPDATE images 
            SET posx = NULL, posy = NULL 
            WHERE posx + columns > $1 OR posy + rows > $2 
            RETURNING id`,
            [req.body.columns, req.body.rows]);

        initialData.movedImages = rows.map(img => img.id);
    }

    broadcastToLive(req.params.url_name, {
        collage,
        resetImages: req.body.resetImages,
        movedImages: initialData.movedImages,
    });

    res.json(initialData);
});

router.get('/:url_name/editor', async (req, res) => {
    const initialData = {};

    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if (rows.length === 0) throw new HTTPError(404);

        initialData.collage = rows[0];
        delete initialData.collage.password;
    }

    {
        const {rows} = await db.query(`
            SELECT images.* 
            FROM images 
            JOIN collages ON images.collages_id = collages.id
            WHERE url_name = $1`, [req.params.url_name]);

        for(let row of rows) {
            delete row.collages_id;
        }

        initialData.images = rows;
    }

    initialData.hasAccess = req.session.access && req.session.access.includes(req.params.url_name);

    res.react(initialData);
});

router.post('/:url_name/login', async (req, res) => {
    const initialData = {};

    const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
    if (rows.length === 0) throw new HTTPError(404);

    if(!await crypto.compare(req.body.password, rows[0].password)) throw new HTTPError(401);

    if(!req.session.access) req.session.access = [];
    req.session.access.push(req.params.url_name);

    res.react(initialData);
});

const lives = {};
function broadcastToLive(url_name, msg) {
    for(let ws of lives[url_name] || []) {
        ws.send(JSON.stringify(msg));
    }
}

router.ws('/:url_name/live', (ws, req) => {
    const url_name = req.params.url_name;
    lives[url_name] = lives[url_name] || [];
    lives[url_name].push(ws);

    ws.on('close', () => {
        lives[url_name] = lives[url_name].filter(live => live !== ws);
    });
});

router.get('/:url_name', async (req, res) => {
    const initialData = {};

    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if (rows.length === 0) throw new HTTPError(404);

        initialData.collage = rows[0];
        delete initialData.collage.password;
    }

    {
        const {rows} = await db.query(`
            SELECT images.* 
            FROM images 
            JOIN collages ON images.collages_id = collages.id
            WHERE url_name = $1`, [req.params.url_name]);

        for(let row of rows) {
            delete row.collages_id;
        }

        initialData.images = rows;
    }

    res.react(initialData);
});

router.post('/', async (req, res) => {

    let urlName = req.body.title.replace(/^[^a-zA-Z0-9]*/, "").replace(/[^a-zA-Z0-9]*$/, "").replace(/[^a-zA-Z0-9]/g, "-");
    if(!urlName){
        return void res.status(400).json({ error: "Title cannot be empty." });
    }

    const {rows} = await db.query(`INSERT INTO collages(name, url_name, author, hidden, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.body.title, urlName, req.body.author, !!req.body.hidden, await crypto.hash(req.body.password)]);

    if(!req.session.access) req.session.access = [];
    req.session.access.push(rows[0].url_name);

    res.json({
        urlName
    });
});

