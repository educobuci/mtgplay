require "mtgsim"

class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "player_#{uuid}"
    if GameServer.seek uuid
      @index = 0
    else
      @index = 1
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
  
  def speak(data)
    ActionCable.server.broadcast "player_#{uuid}", message: data['message'], index: @index
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
    @keep_count = 0
    @players = players.map do |id|
      player = Player.new
      player.id = id
      player
    end
    @game = Game.new @players
    @game.add_observer self
    @players.each_with_index do |p,i|
      ActionCable.server.broadcast "player_#{p.id}", players: i
    end
  end
  def start
    @game.roll_dices
    # @game.start_player @game.die_winner, @game.die_winner
#     @game.draw_hands
#     @game.keep @game.die_winner
#     die_loser = @game.die_winner == 0 ? 1 : 0
#     @game.keep die_loser
#     @game.start
  end
  def update(state, *args)
    @state = state
    @value = args.size == 1 ? args[0] : args
    @players.each do |p|
      ActionCable.server.broadcast "player_#{p.id}", @state => @value
    end
    case @state
    when :start_player
      @game.draw_hands
      @players.each do |p|
        ActionCable.server.broadcast "player_#{p.id}", hand: p.hand
      end
    when :mulligan
      player = @players[@value[0]]
      ActionCable.server.broadcast "player_#{player.id}", hand: player.hand
    end
  end
  def action(uuid, data)
    index = @players.index {|p| p.id == uuid}
    if index
      args = data['args'] ? [index, data['args']].flatten : index
      puts "#{data['method']} ARGS: " + args.to_s
      puts (@game.send data['method'], *args)
      if data['method'] == 'keep'
        @keep_count = @keep_count + 1
        if @keep_count == 2
          @game.start
        end
      end
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
      false
    else
      @@seeks = uuid
      true
    end
  end
  def self.instance
    @@instance
  end
end