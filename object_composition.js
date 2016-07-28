const ObjectComposer =
  (...importedMethodNames) =>
    (behaviour) =>
      (...exportedMethodNames) => {
        // support exported method renaming
        const methodNameMap = exportedMethodNames.reduce((acc, name) => {
            const splits = name.split(' as ');
  
            if (splits.length === 1) {
            acc[name] = name;
          } else if (splits.length == 2) {
            acc[splits[0]] = splits[1]
          }
          return acc;
        }, {});
        target => {
          const composedObject = Symbol('composedObject');
          const instance = Symbol('instance');

          for (const methodName of Object.keys(methodNameMap)) {
            const targetName = methodNameMap[methodName];

            Object.defineProperty(target.prototype, targetName, {
              value: function (...args) {
                if (this[composedObject] == null) {
                  this[composedObject] = Object.assign({}, behaviour);
                  this[composedObject][instance] = this;
                  for (const methodName of importedMethodNames) {
                    this[composedObject][methodName] = function (...args) {
                      return this[instance][methodName](...args);
                    }
                  }
                }
                return this[composedObject][methodName](...args);
              },
              writeable: true
            });
          }
          return target;
        };
      }  
// usage        
const Coloured = ObjectComposer('title')({
  // __Public Methods__
  setColourRGB ({r, g, b}) {
    return this.colourCode = {r, g, b};
  },
  getColourRGB () {
    return this.colourCode;
  },
  getColourHex () {
    return this.rgbToHex(this.colourCode);
  },
  colouredTitle () {
    return `<span font-color=${this.getColourHex()}>${this.title()}</span>`;
  },

  // __Private Methods__
  componentToHex(c) {
    const hex = c.toString(16);

    return hex.length == 1 ? "0" + hex : hex;
  },
  rgbToHex({r, g, b}) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
});

const Todo = Coloured('setColourRGB', 'colouredTitle')(class {
  constructor (name) {
    this.name = name || 'Untitled';
    this.done = false;
  }
  title () {
    return this.name;
  }
  do () {
    this.done = true;
    return this;
  }
  undo () {
    this.done = false;
    return this;
  }
});

let t = new Todo('test');

t.setColourRGB({r: 1, g: 2, b: 3});
t.colouredTitle();
