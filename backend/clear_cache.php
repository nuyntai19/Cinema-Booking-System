<?php
// Clear PHP opcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✓ OPcache cleared\n";
} else {
    echo "✗ OPcache not enabled\n";
}

// Clear APCu cache if available
if (function_exists('apcu_clear_cache')) {
    apcu_clear_cache();
    echo "✓ APCu cache cleared\n";
} else {
    echo "✗ APCu not enabled\n";
}

echo "\nPlease also restart Apache:\n";
echo "1. Open XAMPP Control Panel\n";
echo "2. Stop Apache\n";
echo "3. Start Apache\n";
echo "\nOr run in terminal: net stop Apache2.4 && net start Apache2.4\n";
