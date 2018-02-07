import HTTPError from "node-http-error";
import * as db from "../db";

export const router = require('express-promise-router')();

router.get('/', async (req, res) => {
    const initialData = {};

    const {rows} = await db.query("SELECT * FROM collages WHERE NOT hidden");

    rows.forEach(row => delete row.password);
    rows.reverse();
    initialData.recentlyAdded = rows;

    res.react(initialData);
});

