<?php

class SystemConfig {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all configuration settings as an associative array
     * @return array [config_key => config_value]
     */
    public function getAll() {
        $stmt = $this->db->prepare("SELECT config_key, config_value FROM system_configs");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $configs = [];
        foreach ($results as $row) {
            $configs[$row['config_key']] = $row['config_value'];
        }

        return $configs;
    }

    /**
     * Update multiple configurations
     * @param array $settings [config_key => config_value]
     * @return bool True if successful
     */
    public function updateAll($settings) {
        if (empty($settings)) {
            return true;
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO system_configs (config_key, config_value) 
                VALUES (:key, :value)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
            ");

            foreach ($settings as $key => $value) {
                // Ensure value is properly cast to string to match config_value type
                $valStr = is_array($value) ? json_encode($value) : (string)$value;
                $stmt->execute([
                    ':key' => $key,
                    ':value' => $valStr
                ]);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Failed to update system configs: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get a specific configuration value safely
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get($key, $default = null) {
        $stmt = $this->db->prepare("SELECT config_value FROM system_configs WHERE config_key = ? LIMIT 1");
        $stmt->execute([$key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row ? $row['config_value'] : $default;
    }
}
