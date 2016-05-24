$(function(){
  App.GameViewController = Class.define(function(){
      this.game = App.gameBuilder.create(this);
      this.showDialog("Waiting for another player...");
    },
    {
      showDialog: function(text, buttons, callback){
        var template = Handlebars.compile($("#dialog-template").html());
        $("#dialog").html(template({text: text, buttons: buttons}));
        $("#dialog").find("button").click(callback);
      },
      onData: function(data){
        var state = Object.keys(data)[0];
        var value = data[state];
        for(m in this) {
          if (m == state) {
            this[state](value);
          }
        }
      },
      players: function(index){
        this.index = index;
        this.opponent = index == 0 ? 1 : 0;
        console.log(this.index);
      },
      dices: function(value){
        if(value[this.index] > value[this.opponent]) {
          this.showDialog("Want to start?", ['Yes', 'No'], function(){
            alert($(this).text());
          })
        } else {
          this.showDialog("Waiting opponent decide")
        }
      }
    }
  );
  var controller = new App.GameViewController();
});