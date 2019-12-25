import axios from 'axios';
import PromiseRouter from "express-promise-router";

export const router = PromiseRouter();

router.get('/customImage', async (req, res) => {
  const { url } = req.query;
  
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
  const { board, filename } = req.query;
  
  if(!board || !filename) {
    return void res.status(400).send();
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
  res.setHeader("Cache-Control", "public,max-age=86400,immutable");
  res.setHeader("Expires", new Date(Date.now() + 86400000).toUTCString());
  res.send(response.data);
});

router.get('/thread', async (req, res) => {
  const { board, thread } = req.query;
  
  if(!board || !thread) {
    return void res.status(400).json({});
  }
  
  let response;
  try {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    response = await axios.get(`https://a.4cdn.org/${encodeURIComponent(board)}/thread/${encodeURIComponent(thread)}.json`, {
      headers: { 'if-modified-since': date.toUTCString() },
    });
  } catch(e) {
    console.error(e.response);
    throw e;
  }
  
  res.json(response.data);
});

