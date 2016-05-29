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
    @message_index = {}
    @players.each_with_index do |p,i|
      @message_index[p.id] = -1
      broadcast(p, players: i)
    end
  end
  def start
    @game.roll_dices
  end
  def update(state, *args)
    @state = state
    @value = args.size == 1 ? args[0] : args
    @players.each do |p|
      broadcast(p, @state => @value)
    end
    case @state
    when :start_player
      @game.draw_hands
      @players.each do |p|
        broadcast(p, hand: p.hand)
      end
    when :mulligan
      player = @players[@value[0]]
      broadcast(player, hand: player.hand)
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
  def broadcast(player, data)
    ActionCable.server.broadcast "player_#{player.id}", {
      index: @message_index[player.id] += 1,
      data: data
    }      
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