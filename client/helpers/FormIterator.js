
export default class FormIterator {
  constructor(form) {
    this.form = form;
  }
  
  *[Symbol.iterator]() {
    const used = [];
    
    yield* Array.from(this.form.querySelectorAll("input[type=checkbox]")).map(cb => {
      used.push(cb.getAttribute('name'));
      return [cb.getAttribute('name'), cb.checked];
    });
    yield* Array.from(this.form.querySelectorAll("input"))
          .map(field => [field.name, field.value])
          .filter(field => !used.includes(field[0]));
  }
  
  serialize() {
    const data = {};
    for(const entry of this) {
      data[entry[0]] = entry[1];
    }
    return data;
  }
}
