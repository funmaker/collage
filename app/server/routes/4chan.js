import axios from 'axios';
export const router = require('express-promise-router')();

router.get('/customImage', async (req, res) => {
    const {url} = req.query;

    if(!url) {
        return void res.status(400).json({});
    }

    let response;
    try {
        response = await axios.get(url, {
            responseType: 'arraybuffer',
        });
    } catch(e) {
        console.error(e.response);
        throw e;
    }

    res.header('Content-Type', response.headers['content-type']);
    res.send(response.data);
});

router.get('/image', async (req, res) => {
    const {board, filename} = req.query;

    if(!board || !filename) {
        return void res.status(400).json({});
    }

    let response;
    try {
        response = await axios.get(`https://i.4cdn.org/${board}/${filename}`, {
            responseType: 'arraybuffer',
        });
    } catch(e) {
        console.error(e.response);
        throw e;
    }

    res.header('Content-Type', response.headers['content-type']);
    res.send(response.data);
});

router.get('/thread', async (req, res) => {
    const {board, thread} = req.query;

    if(!board || !thread) {
        return void res.status(400).json({});
    }

    let response;
    try {
        response = await axios.get(`https://a.4cdn.org/${encodeURIComponent(board)}/thread/${encodeURIComponent(thread)}.json`, {
            headers: {'if-modified-since': (new Date()).toUTCString()}
        });
    } catch(e) {
        console.error(e.response);
        throw e;
    }

    res.json(response.data);
});

