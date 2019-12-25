import http from 'http';
import express from 'express';
import expressSession from "express-session";
import pgSession from 'connect-pg-simple';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { router } from "./routes/index";
import { reactMiddleware } from "./helpers/reactHelper";
import HTTPError from "./helpers/HTTPError";
import * as db from "./db";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(compression());
app.use('/static', express.static('static'));

app.use(expressSession({
  store: new (pgSession(expressSession))({ pool: db.rawPool }),
  resave: false,
  secret: 'kek',
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
}));

if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(require('./helpers/webpackHelper').mount());
} else {
  app.use('/client.js', express.static('client.js'));
  app.use('/style.css', express.static('style.css'));
}

app.use(reactMiddleware);

app.use('/', router);

app.use((req, res, next) => {
  next(new HTTPError(404));
});

// noinspection JSUnusedLocalSymbols
app.use((err, req, res, next) => {
  if(err.HTTPcode !== 404) console.error(err);
  
  const code = err.HTTPcode || 500;
  const result = {};
  result.error = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  res.status(code).react(result);
});

export default app;
