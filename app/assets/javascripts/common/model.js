(function(){
  window.Model || (window.Model = Class.extend(window.Observable,
    function (){
      Observable.call(this);
      this.__accessor = null;
    },
    {
      attrAccessor: function(name){
        this['set' + this._capitalize(name)] = function(value){
          var accessor = this.__accessor ? this.__accessor + "." + name : name;
          if (value instanceof Model) {
            value.__accessor = name;
            value.addObserver(this);
          }
          this["_" + name] = value;
          this.notifyObservers(accessor);
        }.bind(this);
        this['get' + this._capitalize(name)] = function(){
          return this["_" + name];
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