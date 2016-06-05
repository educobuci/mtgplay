$(function(){  
  App.GameState = Class.extend(Model, function(object){
    this.attrAccessor("player");
    this.attrAccessor("opponent");
    Model.call(this, object);
  });
  
  App.Player = Class.extend(Model,
    function(object){
      this.attrAccessor("hand");
      this.attrAccessor("board");
      this.attrAccessor("library");
      this.attrAccessor("graveyard");
      this.attrAccessor("life");
      Model.call(this, object);
    },
    {
      getHandSize: function(){
        if (this.getHand() instanceof Array ) {
          return this.getHand().length;
        }
        return this.getHand();
      }
    }
  );
  
  App.GameViewController = Class.define(function(){
      this.game = App.gameBuilder.create(this);
      this.showDialog("Waiting for another player...");
      this.keeped = false;
      this.opponentKeeped = false;
      this.mulled = false;
      this.handCards = [];
      this.current_player = null;
      this.state = new App.GameState();
      this.state.addObserver(this);
    },
    {
      update: function(value){
        if (value.indexOf("player") >= 0) {
          $("#player_me").html(HandlebarsTemplates.player(this.state.getPlayer()));
          $("#hand").html(HandlebarsTemplates.cards({cards: this.state.getPlayer().getHand()}));
        }
        if (value.indexOf("opponent") >= 0) {
          $("#player_opponent").html(HandlebarsTemplates.player(this.state.getOpponent()));
        }
      },
      showDialog: function(text, buttons, callback){
        var template = Handlebars.compile($("#dialog-template").html());
        $("#dialog").html(template({text: text, buttons: buttons}));
        $("#dialog").find("button").click(callback);
      },
      onData: function(data){
        var state = Object.keys(data)[0];
        var value = data[state];
        console.log(data);
        for(m in this){
          if (m === state){
            this[m](value);
          }
        }
      },
      start: function(data){
        this.index = data.index;
        this.opponent = this.index == 0 ? 1 : 0;
        var playerModel = new App.Player(data.players[this.index]);
        var opponentModel = new App.Player(data.players[this.opponent]);
        opponentModel.setHand(7);
        this.state.setPlayer(playerModel);
        this.state.setOpponent(opponentModel);
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
        this.current_player = this.start_player;
      },
      hand: function(cards) {
        this.handCards = cards;
        this.state.getPlayer().setHand(this.handCards);
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
        if (player == this.opponent) {
          this.state.getOpponent().setHand(number + 1);
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
          }
        }
      },
      changed_phase: function(phase) {
        switch (phase) {
        case "first_main":
          console.log(this.index, this.current_player)
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