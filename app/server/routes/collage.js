import * as db from "../db";
import HTTPError from 'node-http-error';
import * as crypto from '../helpers/crypto';

export const router = require('express-promise-router')();

router.patch('/:url_name/image/:id', async (req, res) => {
    const initialData = {};

    const {rows} = await db.query(`
        UPDATE images
        SET posx = $1, posy = $2
        WHERE id = $3
        RETURNING *`,
        [req.body.posx, req.body.posy, req.params.id]);
    if(rows.length === 0) throw new HTTPError(404);

    initialData.image = rows[0];
    delete initialData.image.collages_id;

    res.json(initialData);
});

router.post('/:url_name/image', async (req, res) => {
    const initialData = {};

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

    res.json(initialData);
});

router.post('/:url_name/update', async (req, res) => {
    const initialData = {};

    const {rows} = await db.query(`
        UPDATE collages 
        SET name = $1, rows = $2, columns = $3, 
            img_width = $4, img_height = $5 
        WHERE url_name = $6
        RETURNING id`,
        [req.body.name, req.body.rows, req.body.columns, req.body.img_width, req.body.img_height, req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);

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

    res.react(initialData);
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

    const {rows} = await db.query(`INSERT INTO collages(name, url_name, author, password) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.body.title, urlName, req.body.author, await crypto.hash(req.body.password)]);

    if(!req.session.access) req.session.access = [];
    req.session.access.push(rows[0].id);

    res.json({
        urlName
    });
});

