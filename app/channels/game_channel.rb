require "mtgsim"

class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "player_#{uuid}"
    GameServer.seek uuid
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
  
  def speak(data)
    ActionCable.server.broadcast "player_#{uuid}", message: data['message']
  end
  
  def action(data)
    game.action uuid, data
  end
  
  def game
    GameServer.instance
  end
end

class GameServer
  @@seeks = nil
  @@instance = nil
  
  def initialize(players)
    @players = players.map do |id|
      player = Player.new
      player.id = id
      player
    end
    @game = Game.new @players
    @game.add_observer self
  end
  def start
    @game.roll_dices
    @game.start_player @game.die_winner, @game.die_winner
    @game.draw_hands
    @game.keep @game.die_winner
    die_loser = @game.die_winner == 0 ? 1 : 0
    @game.keep die_loser
    @game.start
    @players.each do |p|
      ActionCable.server.broadcast "player_#{p.id}", game_start: p.id, hand: p.hand.to_json
    end
  end
  def update(state, *args)
    @state = state
    @value = args.size == 1 ? args[0] : args
    @players.each do |p|
      ActionCable.server.broadcast "player_#{p.id}", @state => @value
    end
  end
  def action(uuid, data)
    index = @players.index {|p| p.id == uuid}
    if index
      args = data['args'] ? [index, data['args']].flatten : index
      puts "ARGS: " + args.to_s
      puts (@game.send data['method'], *args)
    else
      raise "Unable to find player uuid: #{uuid}"
    end
  end
  
  # Class methods
  def self.seek(uuid)
    if @@seeks
      @@instance = GameServer.new [@@seeks, uuid]
      @@seeks = nil
      @@instance.start
    else
      @@seeks = uuid
    end
  end
  def self.instance
    @@instance
  end
end