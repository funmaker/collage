

const versions = [`
    CREATE TABLE meta(
        id INTEGER NOT NULL PRIMARY KEY DEFAULT 39,
        version INTEGER,
        
        CONSTRAINT only_one_row CHECK (id = 39)
    );
    
    INSERT INTO meta(version) VALUES(1);
    
    CREATE TABLE "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
    )
    WITH (OIDS=FALSE);
    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    `,`
    CREATE TABLE collages(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        url_name TEXT NOT NULL UNIQUE,
        author TEXT NOT NULL,
        password TEXT NOT NULL,
        
        rows INTEGER DEFAULT 5,
        columns INTEGER DEFAULT 3,
        img_width INTEGER DEFAULT 400,
        img_height INTEGER DEFAULT 300
    );
    
    CREATE TABLE images(
        id SERIAL PRIMARY KEY,
        collages_id INTEGER REFERENCES collages(id),
        source_url TEXT,
        data TEXT NOT NULL,
        posx INTEGER,
        posy INTEGER,
        rows INTEGER NOT NULL,
        columns INTEGER NOT NULL
    );
    `
];

async function clearDatabase(pool) {
    console.warn("!!!CLEARING DATABASE!!!");
    await pool.query(`
        DROP OWNED BY collage;
    `);
}

export default async function migrate(pool) {

    // await clearDatabase(pool);

    const {rows} = await pool.query(`
        SELECT EXISTS 
        (
            SELECT 1
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'meta'
        );
    `);

    let version;

    if(!rows[0].exists) {
        version = 0;
    } else {
        const {rows} = await pool.query(`
            SELECT * FROM meta;
        `);

        if(rows.length === 0) {
            version = 0;
        } else {
            version = rows[0].version;
        }
    }

    if(version !== versions.length) {
        console.log(`Upgrading database from ${version} to ${versions.length}`)
    }

    for(let v = version; v < versions.length; v++){
        await pool.query(versions[v]);
    }

    await pool.query(`
        UPDATE meta SET version=$1
    `, [versions.length]);

    return pool;
}
