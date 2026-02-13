<?php

$redis = new Redis();
$redis->connect($_ENV['REDIS_HOST'], $_ENV['REDIS_PORT']);

// Nếu có password thì mở dòng này
// $redis->auth("yourPassword");

// Kết nối MySQL
$dsn = "mysql:host=" . $_ENV['DB_HOST'] .
       ";port=" . $_ENV['DB_PORT'] .
       ";dbname=" . $_ENV['DB_NAME'];

$pdo = new PDO(
    $dsn,
    $_ENV['DB_USER'],
    $_ENV['DB_PASSWORD'],
    array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    )
);



echo "Worker started...\n";

while (true) {

    $now = time();

    // Lấy booking hết hạn
    $expiredBookings = $redis->zRangeByScore(
        "booking:timeout",
        0,
        $now
    );

    foreach ($expiredBookings as $bookingId) {

        echo "Processing booking $bookingId\n";

        try {
            $pdo->beginTransaction();

            // Lock row để tránh double xử lý
            $stmt = $pdo->prepare("
                SELECT status 
                FROM bookings 
                WHERE id = ? 
                FOR UPDATE
            ");
            $stmt->execute([$bookingId]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                $pdo->rollBack();
                $redis->zRem("booking:timeout", $bookingId);
                continue;
            }

            if ($booking['status'] === 'pending') {

                // Trả ghế về available
                $stmt = $pdo->prepare("
                    UPDATE seats 
                    SET status = 'available'
                    WHERE booking_id = ?
                ");
                $stmt->execute([$bookingId]);

                // Update booking
                $stmt = $pdo->prepare("
                    UPDATE bookings 
                    SET status = 'expired'
                    WHERE id = ?
                ");
                $stmt->execute([$bookingId]);

                echo "Released booking $bookingId\n";
            }

            $pdo->commit();

            // Xóa khỏi Redis queue
            $redis->zRem("booking:timeout", $bookingId);

        } catch (Exception $e) {
            $pdo->rollBack();
            echo "Error: " . $e->getMessage() . "\n";
        }
    }

    sleep(1); 
}
