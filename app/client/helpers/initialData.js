import requestJSON from "./requestJSON";

let initialData = null;
let cancel = null;

export function setInitialData(data) {
    initialData = data;
}

export function getInitialData() {
    if(initialData instanceof Promise) return null;

    return initialData;
}

export function fetchInitialData() {
    if(cancel) cancel();
    cancel = null;

    return initialData = requestJSON({
        cancelCb: cancelFn => cancel = cancelFn,
    });
}
