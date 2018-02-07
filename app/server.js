import express from "express";
import expressWs from 'express-ws';
import expressSession from "express-session";
import pgSession from 'connect-pg-simple';
import expressHandlebars from 'express-handlebars';
import bodyParser from 'body-parser';
import * as webpackHelper from "./server/helpers/webpackHelper";
import * as db from "./server/db";

(async () => {
    await db.pool;

    const app = express();
    expressWs(app);
    const hbs = expressHandlebars.create({});

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({limit: "10mb"}));

    app.use(expressSession({
        store: new (pgSession(expressSession))({ pool: await db.pool }),
        resave: false,
        secret: 'kek',
        saveUninitialized: true,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
    }));

    if (process.env.NODE_ENV !== 'production') {
        console.log('DEVOLOPMENT ENVIRONMENT: Turning on WebPack Middleware...');
        webpackHelper.useWebpackMiddleware(app)
    } else {
        console.log('PRODUCTION ENVIRONMENT');
        app.use('/client.bundle.js', express.static('client.bundle.js'));
        app.use('/style.bundle.css', express.static('style.bundle.css'));
    }

    app.use('static', express.static('static'));

    app.use(require('./server/helpers/reactHelper').reactMiddleware);

    app.use('/', require("./server/routes/index").router);
    app.use('/4chan', require("./server/routes/4chan").router);
    app.use('/collage', require("./server/routes/collage").router);

    app.use((err, req, res, next) => {
        const initialData = {};

        console.error(err);

        initialData._error = {
            status: err.status || 500,
            message: err.message,
            stack: err.stack,
        };

        res.react(initialData);
    });

    const port = process.env.DOCKERIZED ? 80 : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
})();