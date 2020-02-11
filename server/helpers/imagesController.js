import fs from "fs";
import path from "path";
import * as db from "../db";
import { createCanvas, loadImage } from "canvas";
import StreamBuffer from "stream-buffers";
import promisePipe from "promisepipe";

const generatedDir = "./generated";
const generatedImages = new Map();

(async () => {
  const dir = await fs.promises.readdir(generatedDir);
  
  for(let group of dir) {
    const images = await fs.promises.readdir(path.resolve(generatedDir, group));
    
    for(let image of images) {
      generatedImages.set(path.resolve(generatedDir, group, image), { generated: true })
    }
  }
  
  console.log(generatedImages);
})().catch(console.error);

export function getImage(dirname, filename) {
  let imagePath = path.resolve(generatedDir, dirname, filename);
  const image = generatedImages.get(imagePath);
  
  if(image && image.generated) return imagePath;
  else return null;
}

export async function clearImages(dirname) {
  let imageRoot = path.resolve(generatedDir, dirname);
  for(let imagePath of generatedImages.keys()) {
    if(imagePath.startsWith(imageRoot)) {
      generatedImages.delete(imagePath);
      await fs.promises.unlink(imagePath);
    }
  }
}

export async function requestImage(id, dirname, filename, options) {
  let imagePath = path.resolve(generatedDir, dirname, filename);
  const image = generatedImages.get(imagePath);
  
  if(image && image.generated) return null;
  else if(image && image.promise) return image.promise;
  
  const promise = generateImage(id, imagePath, options);
  generatedImages.set(imagePath, { generated: false, promise });
  await promise;
}

async function generateImage(id, imagePath, { format, maxSize, maxFilesize }) {
  let collage;
  {
    const { rows } = await db.query(`
      SELECT img_width, img_height, columns, rows, url_name
      FROM collages
      WHERE id = $1`
    , [id]);
  
    collage = rows[0];
  }
  
  let images;
  {
    const { rows } = await db.query(`
      SELECT data, posx, posy, columns, rows
      FROM images
      WHERE images.collages_id = $1`
    , [id]);
    
    images = rows;
  }
  
  let img_width = collage.img_width;
  let img_height = collage.img_height;
  let width = collage.img_width * collage.columns;
  let height = collage.img_height * collage.rows;
  
  if(maxSize) {
    const fullWidth = width;
    const fullHeight = height;
    
    if(width > maxSize) {
      width = maxSize;
      height *= (width / fullWidth);
    }
    if(height > maxSize) {
      height = maxSize;
      width *= (height / fullHeight);
    }
  
    const img_width = Math.floor(width / collage.columns);
    const img_height = Math.floor(height / collage.rows);
  
    width = img_width * collage.columns;
    height = img_height * collage.rows;
  }
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  await Promise.all(images.filter(img => img.posx !== null && img.posy !== null)
    .map(image => loadImage(image.data)
      .then(loaded => {
        ctx.drawImage(loaded, image.posx * img_width, image.posy * img_height, img_width * image.columns, img_height * image.rows);
      })
      .then(() => new Promise(res => setTimeout(res, 0)))));
  
  await fs.promises.mkdir(path.dirname(imagePath), { recursive: true });
  
  if(!maxFilesize) {
    if(format === "png") await promisePipe(canvas.createJPEGStream(), fs.createWriteStream(imagePath));
    else await promisePipe(canvas.createPNGStream(), fs.createWriteStream(imagePath));
  } else {
    let n = 1;
    for(let scale = 1; scale > 0; scale = scale - 0.125) {
      let newWidth = Math.floor(width * scale);
      let newHeight = Math.floor(height * scale);
    
      const newCanvas = createCanvas(newWidth, newHeight);
      const newCtx = newCanvas.getContext('2d');
      await newCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
    
      const streamBuffer = new StreamBuffer.WritableStreamBuffer();
      if(format === "png") await promisePipe(canvas.createJPEGStream({ quality: 0.75 }), streamBuffer);
      else await promisePipe(canvas.createPNGStream(), fs.createWriteStream(imagePath));
      const buffer = streamBuffer.getContents();
    
      console.log(`Try ${n++}: scale=${scale} size=${Math.floor(buffer.length / 10) / 100}`);
    
      if(buffer.length < maxFilesize) break;
    }
  }
  
  generatedImages.set(imagePath, { generated: true });
}

