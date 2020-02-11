import imgHash from 'imghash';
import hamming from 'hamming-distance';
import PromiseRouter from "express-promise-router";
import WorkerPool from "workerpool";
import HTTPError from "../helpers/HTTPError";
import * as crypto from '../helpers/crypto';
import * as imagesController from "../helpers/imagesController";
import * as db from "../db";

const workerpool = WorkerPool.pool(process.env.NODE_ENV === "development" ? "./build/hash.js" : "./hash.js");
export const router = PromiseRouter();

router.get('/:url_name/4chan', async (req, res) => {
  let collage;
  {
    const { rows } = await db.query("SELECT id, url_name, name FROM collages WHERE url_name = $1", [req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);
  
    collage = rows[0];
  }
  
  const filename = `${collage.url_name}.4chan.jpg`;
  let imagePath;
  if((imagePath = imagesController.getImage(collage.url_name, filename))) {
    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.4chan.jpg"`);
    return void res.sendFile(imagePath);
  }
  
  imagesController.requestImage(collage.id, collage.url_name, filename, { format: "jpeg", maxSize: 10000, maxFileSize: 4194304 }).catch(console.error);
  
  res.header('Retry-After', '60');
  throw new HTTPError(503, "Generating Image");
});

router.get('/:url_name/jpeg', async (req, res) => {
  let collage;
  {
    const { rows } = await db.query("SELECT id, url_name, name FROM collages WHERE url_name = $1", [req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);
    
    collage = rows[0];
  }
  
  const filename = `${collage.url_name}.jpg`;
  let imagePath;
  if((imagePath = imagesController.getImage(collage.url_name, filename))) {
    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.4chan.jpg"`);
    return void res.sendFile(imagePath);
  }
  
  imagesController.requestImage(collage.id, collage.url_name, filename, { format: "jpeg" }).catch(console.error);
  
  res.header('Retry-After', '60');
  throw new HTTPError(503, "Generating Image");
});

router.get('/:url_name/png', async (req, res) => {
  let collage;
  {
    const { rows } = await db.query("SELECT id, url_name, name FROM collages WHERE url_name = $1", [req.params.url_name]);
    if(rows.length === 0) throw new HTTPError(404);
    
    collage = rows[0];
  }
  
  const filename = `${collage.url_name}.png`;
  let imagePath;
  if((imagePath = imagesController.getImage(collage.url_name, filename))) {
    res.header('Content-Type', 'image/jpeg');
    res.header('Content-Disposition', `inline; filename="${collage.name}.4chan.jpg"`);
    return void res.sendFile(imagePath);
  }
  
  imagesController.requestImage(collage.id, collage.url_name, filename, { format: "png" }).catch(console.error);
  
  res.header('Retry-After', '60');
  throw new HTTPError(503, "Generating Image");
});

router.patch('/:url_name/image/:id', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  
  await imagesController.clearImages(req.params.url_name);
  
  const { rows } = await db.query(`
    UPDATE images
    SET posx = $1, posy = $2
    WHERE id = $3
    RETURNING *`
  , [req.body.posx, req.body.posy, req.params.id]);
  if(rows.length === 0) throw new HTTPError(404);
  
  initialData.image = rows[0];
  delete initialData.image.collages_id;
  
  broadcastToLive(req.params.url_name, {
    updateImage: initialData.image,
  });
  
  res.json(initialData);
});

router.delete('/:url_name/image/:id', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  
  await imagesController.clearImages(req.params.url_name);
  
  const { rows } = await db.query(`
        DELETE FROM images
        WHERE id = $1
        RETURNING 1`,
                                  [req.params.id]);
  if(rows.length === 0) throw new HTTPError(404);
  
  broadcastToLive(req.params.url_name, {
    removeImage: req.params.id,
  });
  
  res.json(initialData);
});

router.post('/:url_name/image', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  
  let hash;
  if(req.body.source_url) {
    hash = await workerpool.exec("calculateHash", [req.body.source_url]);
  } else {
    const matches = req.body.data.match(/^data:.+;base64,(.*)$/);
    const buffer = new Buffer(matches[1], 'base64');
    hash = await imgHash.hash(buffer);
  }
  
  const { rows } = await db.query(`
    INSERT INTO images(collages_id, source_url, data, posx, posy, rows, columns, hash)
    SELECT collages.id, $1, $2, $3, $4, $5, $6, $7
    FROM collages
    WHERE url_name = $8
    RETURNING *`
  , [req.body.source_url, req.body.data, req.body.posx, req.body.posy, req.body.rows, req.body.columns, hash, req.params.url_name]);
  if(rows.length === 0) throw new HTTPError(404);
  
  initialData.image = rows[0];
  delete initialData.image.collages_id;
  
  broadcastToLive(req.params.url_name, {
    newImage: initialData.image,
  });
  
  res.json(initialData);
});

router.post('/:url_name/imageCheck', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  const url = req.body.url;
  
  const hash = await workerpool.exec("calculateHash", [url]);
  
  const { rows: images } = await db.query(`
    SELECT images.hash, images.source_url
    FROM images
    JOIN collages ON images.collages_id = collages.id
    WHERE collages.url_name = $1 AND images.source_url IS NOT NULL
  `, [req.params.url_name]);
  
  initialData.images = [];
  
  for(const image of images) {
    initialData.images.push({
      source_url: image.source_url,
      diff: hamming(hash, image.hash),
    });
  }
  
  initialData.images.sort((a, b) => a.diff - b.diff);
  initialData.images = initialData.images.filter(img => img.diff <= 16);
  
  res.json(initialData);
});

router.post('/:url_name/update', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  
  await imagesController.clearImages(req.params.url_name);
  
  const { rows } = await db.query(`
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
    const { rows } = await db.query(`
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
    const { rows } = await db.query(`
      SELECT id, name, url_name, author, hidden, rows, columns, img_width, img_height
      FROM collages
      WHERE url_name = $1`
      , [req.params.url_name]);
    
    if(rows.length === 0) throw new HTTPError(404);
    
    initialData.collage = rows[0];
  }
  
  {
    const { rows } = await db.query(`
      SELECT id, source_url, data, posx, posy, rows, columns
      FROM images
      WHERE images.collages_id = $1
    `, [initialData.collage.id]);
    
    initialData.images = rows;
  }
  
  initialData.hasAccess = req.session.access && req.session.access.includes(req.params.url_name);
  initialData.hasAccess = !!initialData.hasAccess;
  
  const url_name = initialData.collage.url_name;
  initialData.generated = {
    jpeg: !!imagesController.getImage(url_name, `${url_name}.jpg`),
    png: !!imagesController.getImage(url_name, `${url_name}.png`),
    ["4chan"]: !!imagesController.getImage(url_name, `${url_name}.4chan.jpg`),
  };
  
  res.react(initialData);
});

router.delete('/:url_name', async (req, res) => {
  const initialData = {};
  
  if(!req.session.access || !req.session.access.includes(req.params.url_name)) throw new HTTPError(401);
  
  const { rows } = await db.query("DELETE FROM collages WHERE url_name = $1 RETURNING 1", [req.params.url_name]);
  if(rows.length === 0) throw new HTTPError(404);
  
  res.react(initialData);
});

router.post('/:url_name/login', async (req, res) => {
  const initialData = {};
  
  const { rows } = await db.query("SELECT * FROM collages WHERE url_name = $1", [req.params.url_name]);
  if(rows.length === 0) throw new HTTPError(404);
  
  if(!await crypto.compare(req.body.password, rows[0].password)) throw new HTTPError(401);
  
  if(!req.session.access) req.session.access = [];
  req.session.access.push(req.params.url_name);
  
  res.react(initialData);
});

const lives = {};
function broadcastToLive(url_name, msg) {
  for(const ws of lives[url_name] || []) {
    ws.send(JSON.stringify(msg));
  }
}

setImmediate(() => {
  router.ws('/:url_name/live', (ws, req) => {
    const url_name = req.params.url_name;
    lives[url_name] = lives[url_name] || [];
    lives[url_name].push(ws);
    
    ws.on('close', () => {
      lives[url_name] = lives[url_name].filter(live => live !== ws);
    });
  });
});

router.get('/:url_name', async (req, res) => {
  const initialData = {};
  
  {
    const { rows } = await db.query(`
      SELECT id, name, url_name, author, hidden, rows, columns, img_width, img_height
      FROM collages
      WHERE url_name = $1`
    , [req.params.url_name]);
    
    if(rows.length === 0) throw new HTTPError(404);
    
    initialData.collage = rows[0];
  }
  
  {
    const { rows } = await db.query(`
      SELECT id, source_url, data, posx, posy, rows, columns
      FROM images
      WHERE images.collages_id = $1
    `, [initialData.collage.id]);
    
    initialData.images = rows;
  }
  
  const url_name = initialData.collage.url_name;
  initialData.generated = {
    jpeg: !!imagesController.getImage(url_name, `${url_name}.jpg`),
    png: !!imagesController.getImage(url_name, `${url_name}.png`),
    ["4chan"]: !!imagesController.getImage(url_name, `${url_name}.4chan.jpg`),
  };
  
  res.react(initialData);
});

router.post('/', async (req, res) => {
  const urlName = req.body.title.replace(/^[^a-zA-Z0-9]*/, "").replace(/[^a-zA-Z0-9]*$/, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  if(!urlName) {
    return void res.status(400).json({ error: "Title cannot be empty." });
  }
  
  {
    const { rows } = await db.query(`SELECT 1 FROM collages WHERE url_name = $1 OR name = $2`, [urlName, req.body.title]);
    if(rows.length > 0) return void res.status(400).json({ error: "Collage name already in use." });
  }
  
  const { rows } = await db.query(`INSERT INTO collages(name, url_name, author, hidden, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                                  [req.body.title, urlName, req.body.author, !!req.body.hidden, await crypto.hash(req.body.password)]);
  
  if(!req.session.access) req.session.access = [];
  req.session.access.push(rows[0].url_name);
  
  res.json({
    urlName,
  });
});

