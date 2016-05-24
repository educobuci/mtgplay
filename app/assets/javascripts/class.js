(function(){
  window.Class || (window.Class = {})
  window.Class.define = function(klass, methods) {
    for(m in methods){
      klass.prototype[m] = methods[m]
    }
    return klass;
  };
})();