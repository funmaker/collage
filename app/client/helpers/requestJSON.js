import isNode from 'detect-node';
import axios from 'axios';
import qs from 'querystring';

const CancelToken = axios.CancelToken;

export default async function requestJSON({method, href, host, pathname, search, data, cancelCb}) {
    if(isNode) return new Promise(() => {});

    if(typeof search === "object") {
        search = "?" + qs.stringify(search);
    }

    host = host || location.host;
    pathname = pathname || location.pathname;
    search = search || location.search;
    href = href || `//${host}${pathname}${search}`;
    method = method || "GET";


    const response = await axios({
        method: method.toUpperCase(),
        url: href,
        cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
        data
    });

    return response.data;
}
