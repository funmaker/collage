import * as db from "../db";
import HTTPError from 'node-http-error';
import * as crypto from '../helpers/crypto';

export const router = require('express-promise-router')();

router.get('/:url_name/editor', async (req, res) => {
    const initialData = {};

    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if(rows.length === 0) throw new HTTPError(404);

        initialData.collage = rows[0];
        delete initialData.collage.password;
    }

    res.react(initialData);
});

router.get('/:url_name', async (req, res) => {
    const initialData = {};

    {
        const {rows} = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
        if(rows.length === 0) throw new HTTPError(404);

        initialData.collage = rows[0];
        delete initialData.collage.password;
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

