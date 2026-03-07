<?php
$db = new PDO('mysql:host=localhost;dbname=galaxy_cinema;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

echo "PROMOTIONS TABLE:\n";
$stmt = $db->query('DESCRIBE promotions');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' | ' . $row['Type'] . ' | ' . $row['Null'] . ' | ' . $row['Default'] . "\n";
}

echo "\nUSER_VOUCHERS TABLE:\n";
$stmt = $db->query('DESCRIBE user_vouchers');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' | ' . $row['Type'] . ' | ' . $row['Null'] . ' | ' . $row['Default'] . "\n";
}

echo "\nPROMOTIONS DATA (non-auto):\n";
$stmt = $db->query('SELECT id, code, discount_type, discount_amount FROM promotions WHERE is_auto_apply = 0');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row) . "\n";
}

echo "\nUSER_VOUCHERS DATA:\n";
$stmt = $db->query('SELECT uv.*, p.code as promo_code FROM user_vouchers uv LEFT JOIN promotions p ON uv.promotion_id = p.id LIMIT 20');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row) . "\n";
}

echo "\nBOOKINGS TABLE:\n";
$stmt = $db->query('DESCRIBE bookings');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' | ' . $row['Type'] . "\n";
}

echo "\nBOOKINGS WITH DISCOUNT:\n";
$stmt = $db->query('SELECT id, user_voucher_id, discount_amount, final_price, status FROM bookings WHERE discount_amount > 0 LIMIT 20');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row) . "\n";
}

echo "\nUSAGE COUNT PER PROMOTION:\n";
$stmt = $db->query("SELECT p.id, p.code, COUNT(uv.id) as used_count FROM promotions p LEFT JOIN user_vouchers uv ON uv.promotion_id = p.id AND uv.status = 'USED' WHERE p.is_auto_apply = 0 GROUP BY p.id, p.code");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row) . "\n";
}

echo "\nTOTAL DISCOUNT PER PROMOTION:\n";
$stmt = $db->query("SELECT p.id, p.code, COALESCE(SUM(b.discount_amount), 0) as total_discount FROM promotions p LEFT JOIN user_vouchers uv ON uv.promotion_id = p.id AND uv.status = 'USED' LEFT JOIN bookings b ON b.user_voucher_id = uv.id WHERE p.is_auto_apply = 0 GROUP BY p.id, p.code");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row) . "\n";
}
