import axios from 'axios';
export const router = require('express-promise-router')();

router.get('/', async (req, res) => {
    const {board, thread} = req.query;

    if(!board || !thread) {
        return void res.status(400).json({});
    }

    let response;
    try {
        response = await axios.get(`https://a.4cdn.org/${board}/thread/${thread}.json`, {
            headers: {'if-modified-since': (new Date()).toUTCString()}
        });
    } catch(e) {
        console.error(e.response);
        throw e;
    }

    res.json(response.data);
});

