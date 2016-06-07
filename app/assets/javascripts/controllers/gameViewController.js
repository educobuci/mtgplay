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
      this.current_player = null;
      this.state = new App.GameState();
      this.state.addObserver(this);
      this.gameStarted = false;
      this.config = {
        skipEmptyCombat: true
      };
      this.lastPhase
    },
    {
      update: function(value){
        if (!this.gameStarted) {
          if (value.indexOf("player") >= 0) {
            $("#player_me").html(HandlebarsTemplates.player(this.state.getPlayer()));
            $("#hand").html(HandlebarsTemplates.cards({cards: this.state.getPlayer().getHand()}));
            $("#player_board .lands").html(HandlebarsTemplates.cards({cards: this.state.getPlayer().getBoard()}));
          }
          if (value.indexOf("opponent") >= 0) {
            $("#player_opponent").html(HandlebarsTemplates.player(this.state.getOpponent()));
            $("#opponent_board .lands").html(HandlebarsTemplates.cards({cards: this.state.getOpponent().getBoard()}));
          }
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
        this.state.getPlayer().setHand(cards);
        // This is just for very first hand and start the game
        if (this.start_player == this.index && !this.mulled) {
          this.handleMulligan(this.state.getPlayer().getHand().length - 1);
        }
      },
      mulligan: function(data) {
        player = data[0];
        number = Math.max(6 - data[1],0);
        if (player == this.opponent && !this.keeped) {
          this.handleMulligan(this.state.getPlayer().getHand().length -1);
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
            this.handleMulligan(this.state.getPlayer().getHand().length -1);
          }
        }
      },
      changed_phase: function(phase) {
        switch (phase) {
        case "first_main":
          if (this.index == this.current_player) {
            this.showDialog("Cast spells", ["OK"], function(){
              App.game.action("pass");
            });
          } else {
            this.showDialog("Waiting for the opponent", ["OK"], function(){
              App.game.action("pass");
            });
          }
          if (!this.gameStarted) {
            this.gameStarted = true;
            this.bindEvents();
          }
          break;          
        // case "blockers":
        // case "damage":
        // case "end_combat":
        //   if (this.state.attackers.length === 0) {
        //     App.game.action("pass");
        //   }
        //   break;
        default:
          
        }
      },
      bindEvents: function(){
        $("#hand").on('click', 'div.card', function(){
          App.game.action("play_card", $(this).index());
        });
        $("#player_board").on("click", 'div.card', function(){
          App.game.action("tap_card", $(this).data("index"));
        });
      },
      game_state: function(state){
        this.state = state;
        var playerState = state.players[this.index];
        var opponentState = state.players[this.opponent];
        var filterLands = function(c){ return c.types.indexOf("land") >= 0; };
        var filterNonLands = function(c){ return c.types.indexOf("land") < 0; };
        var map = function(c,i){
          c.index = i;
          return c;
        };
        $("#player_me").html(HandlebarsTemplates.player(playerState));
        $("#hand").html(HandlebarsTemplates.cards({cards: playerState.hand}));
        $("#player_board .lands").html(HandlebarsTemplates.cards({
          cards: playerState.board.map(map).filter(filterLands)
        }));
        $("#player_board .creatures").html(HandlebarsTemplates.cards({
          cards: playerState.board.map(map).filter(filterNonLands)
        }));
        $("#player_opponent").html(HandlebarsTemplates.player(opponentState));
        $("#opponent_board .lands").html(HandlebarsTemplates.cards({
          cards: opponentState.board.map(map).filter(filterLands)
        }));
        $("#opponent_board .creatures").html(HandlebarsTemplates.cards({
          cards: opponentState.board.map(map).filter(filterNonLands)
        }));
        if (this.gameStarted) {
          $("#phases li").removeClass("selected");
          $("#phases li." + state.phase).addClass("selected");
        }
      }
    }
  );
  var controller = new App.GameViewController();
});