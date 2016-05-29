App.gameBuilder || (App.gameBuilder = {})
App.gameBuilder.create = function(delegate) {
  App.game = App.cable.subscriptions.create("GameChannel", {
    connected: function() {
      console.log("Connected")
      this.pool = [];
      this.messageIndex = 0;
    },
    disconnected: function() {
      console.log("Diconnected")
      this.pool = null;
    },
    received: function(message) {
      console.log("message index:" + message.index);
      this.pool.push(message);
      this.checkPool();
    },
    checkPool: function(){
      this.pool.sort(function(a, b){
        return a.index - b.index;
      });
      for (var i = this.messageIndex; i < this.pool.length; i++) {
        var message = this.pool[i];
        if (message.index === this.messageIndex) {
          delegate.onData(message.data);
          this.messageIndex++;
        } else {
          console.warn("Incorrect message index: " + message.index);
        }
      }
    },
    speak: function(message){
      return this.perform('speak', { message: message });
    },
    
    // Game channel methods
    action: function(method, args) {
      return this.perform('action', { method: method, args: args })
    },
  });
};
