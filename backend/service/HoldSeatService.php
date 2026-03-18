<?php
/**
 * Hold Seat Service
 */
class HoldSeatService {
    private $redis;
    public static function getHoldKey($showtimeId, $seatId) {
        return "hold:showtime:$showtimeId:seat:$seatId";
    }
    public function __construct() {
        $this->redis = new Redis();
        $this->redis->connect(Config::$redis_host, Config::$redis_port);
    }   
    public function holdSeats($showtimeId, $seatIds, $userId, $holdDuration = 300) {

        $lua = "
            for i, key in ipairs(KEYS) do
                if redis.call('EXISTS', key) == 1 then
                    return 0
                end
            end
            for i, key in ipairs(KEYS) do
                redis.call('SET', key, ARGV[1], 'EX', ARGV[2])
            end
            return 1
        ";

        $keys = [];
        foreach ($seatIds as $seatId) {
            $keys[] = self::getHoldKey($showtimeId, $seatId);
        }

        return $this->redis->eval($lua, $keys, [$userId, $holdDuration]);
    }
    public function releaseSeats($showtimeId, $seatIds, $userId) {
        $lua = "
            for i, key in ipairs(KEYS) do
                if redis.call('GET', key) ~= ARGV[1] then
                    return 0
                end
            end
            for i, key in ipairs(KEYS) do
                redis.call('DEL', key)
            end
            return 1
        ";

        $keys = [];
        foreach ($seatIds as $seatId) {
            $keys[] = self::getHoldKey($showtimeId, $seatId);
        }

        return $this->redis->eval($lua, $keys, [$userId]);
    }
    public function isSeatHeld($showtimeId, $seatId) {
        $key = self::getHoldKey($showtimeId, $seatId);
        return $this->redis->exists($key);  
    }
}