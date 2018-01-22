
export default class FormIterator {
    constructor(form) {
        this.form = form;
    }

    toJSON() {
        return [...this].reduce((acc, el) => (el.name ? {...acc, [el.name]: el.value} : acc), {});
    }

    *[Symbol.iterator]() {
        yield* this.form.elements;
    }
}
