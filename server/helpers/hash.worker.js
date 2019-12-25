import axios from "axios";
import imgHash from "imghash";
import WorkerPool from "workerpool";

async function calculateHash(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(response.data);
  
  return await imgHash.hash(buffer);
}

WorkerPool.worker({
  calculateHash,
});
