$(function(){
  App.GameViewController = Class.define(function(){
      this.game = App.gameBuilder.create(this);
      this.showDialog("Waiting for another player...");
      this.keeped = false;
      this.opponentKeeped = false;
      this.mulled = false;
      this.handCards = [];
      this.current_player = null;
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
        console.log(data);
        for(m in this) {
          if (m === state) {
            this[m](value);
          }
        }
      },
      players: function(index){
        this.index = index;
        this.opponent = index == 0 ? 1 : 0;
        console.log(this.index);
      },
      dices: function(value){
        if(value[this.index] > value[this.opponent]){
          this.showDialog("Want to start?", ['Yes', 'No'], function(e){
            start = $(e.target).text() == 'Yes' ? this.index : this.opponent;
            App.game.action("start_player", start);
          }.bind(this));
        } else {
          this.showDialog("Waiting opponent decide");
        }
      },
      start_player: function(player){
        this.start_player = player;
        if (this.start_player !== this.index) {
          this.showDialog("Waiting for the opponent.");
        }
      },
      hand: function(cards) {
        console.dir(cards.map(function(c){ return c.name }));
        this.handCards = cards;
        
        // This is just for very first hand and start the game
        if (this.start_player == this.index && !this.mulled) {
          this.handleMulligan(this.handCards.length - 1);
        }
      },
      mulligan: function(data) {
        player = data[0]
        number = Math.max(6 - data[1],0)
        if (player == this.opponent && !this.keeped) {
          this.handleMulligan(this.handCards.length -1);
        } else if (this.opponentKeeped) {
          this.handleMulligan(number);
        }
      },
      handleMulligan: function(number) {
        var number = number;
        this.showDialog("Want to mulligan to " + number + "?",
          ['Mulligan', 'Keep'], function(e){
            var value = $(e.target).text().toLowerCase();
            App.game.action(value);
            this.mulled = true;
            this.showDialog("Waiting for the opponent.");
          }.bind(this));
      },
      keep: function(keeped) {
        if (keeped == this.index) {
          this.keeped = true;
        } else {
          this.opponentKeeped = true;
          if (!this.keeped) {
            this.handleMulligan(this.handCards.length -1);
          } else {
            this.current_player = this.start_player
          }
        }
      },
      changed_phase: function(phase) {
        switch (phase) {
        case "first_main":
          if (this.index == this.current_player) {
            this.showDialog("Cast spells");
          } else {
            this.showDialog("Waiting for the opponent");
          }
          break;
        default:
          
        }
      }
    }
  );
  var controller = new App.GameViewController();
});