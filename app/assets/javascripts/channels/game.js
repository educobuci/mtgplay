App.game = App.cable.subscriptions.create("GameChannel", {
  connected: function() {
    console.log("Waiting for another player...")
  },
  disconnected: function() {
    
  },
  received: function(data) {
    //alert(data.message)
    console.log(data)
  },
  speak: function(message){
    return this.perform('speak', { message: message });
  },
  move: function(method, args) {
    return this.perform('move', { method: method, args: args })
  }
});