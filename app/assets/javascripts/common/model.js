(function(){
  var FIELD_PREFIX = "_";
  window.Model || (window.Model = Class.extend(window.Observable,
    function (object){
      Observable.call(this);
      this.__accessor = null;
      for(name in object){
        this[FIELD_PREFIX + name] = object[name];
      }
    },
    {
      attrAccessor: function(name){
        this['set' + this._capitalize(name)] = function(value){
          var accessor = this.__accessor ? this.__accessor + "." + name : name;
          if (value instanceof Model) {
            value.__accessor = accessor;
            value.addObserver(this);
          }
          this[FIELD_PREFIX + name] = value;
          this.notifyObservers(accessor);
        }.bind(this);
        this['get' + this._capitalize(name)] = function(){
          return this[FIELD_PREFIX + name];
        }.bind(this);
      },
      _capitalize: function(string){
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      update: function(value){
        this.notifyObservers(value);
      }
    }
  ));
})();