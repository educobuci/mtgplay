(function(){
  window.Observable || (window.Observable = Class.define(
    function(){
      this.observers = [];
    },
    {
      addObserver: function(observer){
        var index = this.observers.indexOf(observer);
        if (index < 0) {
          this.observers.push(observer);
        }
      },
      removeObserver: function(observer){
        var index = this.observers.indexOf(observer);
        if (index >= 0) {
          this.observers.splice(index,1);
        }        
      },
      notifyObservers: function(value){
        for (var i = 0; i < this.observers.length; i++) {
          this.observers[i].update(value);
        }
      }
    }
  ));
})();