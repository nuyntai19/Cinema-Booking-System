<?php

/**
 * Database Configuration
 */
class Database
{
    private static $instance = null;
    private $connection;

    // Database credentials - read from environment variables or use defaults
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset;

    private function __construct()
    {
        // Read from environment variables with fallback to defaults
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'galaxy_cinema';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASSWORD') ?: '12345678';
        $this->charset = getenv('DB_CHARSET') ?: 'utf8mb4';

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            die(json_encode([
                'success' => false,
                'message' => 'Database Connection Error: ' . $e->getMessage()
            ]));
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->connection;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
}
