App.gameBuilder || (App.gameBuilder = {})
App.gameBuilder.create = function(delegate) {
  App.game = App.cable.subscriptions.create("GameChannel", {
    connected: function() {
      console.log("Connected")
    },
    disconnected: function() {
      console.log("Diconnected")
    },
    received: function(data) {
      delegate.onData(data);
    },
    speak: function(message){
      return this.perform('speak', { message: message });
    },
    action: function(method, args) {
      return this.perform('action', { method: method, args: args })
    }
  });
};
