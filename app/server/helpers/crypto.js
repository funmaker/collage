import bcrypt from 'bcrypt-nodejs';

const defaultSalt = bcrypt.genSaltSync();

export function hash(pass, salt = defaultSalt) {
    return new Promise((res, rej) => bcrypt.hash(pass, salt, null, (err, result) => err ? rej(err) : res(result)));
}

export function compare(pass, encrypted) {
    return new Promise((res, rej) => bcrypt.compare(data, encrypted, (err, result) => err ? rej(err) : res(result)))
}