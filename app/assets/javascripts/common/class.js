(function(){
  window.Class || (window.Class = {})
  window.Class.define = function(klass, methods) {
    for(m in methods){
      klass.prototype[m] = methods[m]
    }
    return klass;
  };
  window.Class.extend = function(klass, constructor, methods) {
    var extend = constructor;
    extend.prototype = new klass();
    return window.Class.define(extend, methods);
  }
})();