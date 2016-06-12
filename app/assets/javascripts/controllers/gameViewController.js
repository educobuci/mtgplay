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
      this.state = {};
      this.gameStarted = false;
      this.config = {
        skipEmptyCombat: true
      };
    },
    {
      update: function(){
        $("#player_me").html(HandlebarsTemplates.player(this.state.player));
        $("#hand").html(HandlebarsTemplates.cards(this.state.player.hand));
        $("#player_opponent").html(HandlebarsTemplates.player(this.state.opponent));
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
        this.state.player = data.players[this.index];
        this.state.opponent = data.players[this.opponent];
        this.state.opponent.hand = 7;
        this.state.player.hand = 7;
        Handlebars.registerPartial('player', HandlebarsTemplates.player);
        Handlebars.registerPartial('cards', HandlebarsTemplates.cards);
        $("#frame").html(HandlebarsTemplates.game(this.state));
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
        this.state.player.hand = cards;
        this.update();
        // This is just for very first hand and start the game
        if (this.start_player == this.index && !this.mulled) {
          this.handleMulligan(this.state.player.hand.length - 1);
        }
      },
      mulligan: function(data) {
        player = data[0];
        number = Math.max(6 - data[1],0);
        if (player == this.opponent && !this.keeped) {
          this.handleMulligan(this.state.player.hand.length -1);
        } else if (this.opponentKeeped) {
          this.handleMulligan(number);
        }
        if (player == this.opponent) {
          this.state.opponent.hand = number + 1;
          this.update();
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
            this.handleMulligan(this.state.player.hand.length -1);
          }
        }
      },
      changed_phase: function(phase) {
        switch (phase) {
        case "first_main":
          if (!this.gameStarted) {
            this.gameStarted = true;
            this.bindEvents();
          }
          break;
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
      getStateViewModel: function(state){
        state.player = state.players[this.index];
        state.opponent = state.players[this.opponent];
        var map = function(c,i){
          c.index = i;
          return c;
        };
        [state.player, state.opponent].forEach(function(p){
          p.boardLands = p.board.map(map).filter(function(c){
            return c.types.indexOf("land") >= 0;
          });
          p.boardNonLands = p.board.map(map).filter(function(c){
            return c.types.indexOf("land") < 0;
          });
        });
        return state;
      },
      game_state: function(state){
        if (this.gameStarted) {
          this.state = this.getStateViewModel(state);
          $("#frame").html(HandlebarsTemplates.game(this.state));
          this.bindEvents();
          $("#phases li." + state.phase).addClass("selected");
          if (this.index === state.priority_player) {
            this.showDialog("Cast spells and activate abilities.", ["OK"], function(){
              App.game.action("pass");
            });
          } else {
            this.showDialog("Waiting for the opponent.");
          }
        }
      }
    }
  );
  var controller = new App.GameViewController();
});