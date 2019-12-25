import PromiseRouter from "express-promise-router";
import * as db from "../db";
import * as chan from "./4chan";
import * as collage from "./collage";

export const router = PromiseRouter();

router.use("/4chan", chan.router);
router.use("/collage", collage.router);

router.get('/', async (req, res) => {
  const initialData = {};
  
  const { rows } = await db.query("SELECT * FROM collages WHERE NOT hidden");
  
  rows.forEach(row => delete row.password);
  rows.reverse();
  initialData.recentlyAdded = rows;
  
  res.react(initialData);
});

