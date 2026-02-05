<?php
/**
 * Validator Helper - Input validation utilities
 */
class Validator {
    private $errors = [];
    private $data;
    
    public function __construct($data) {
        $this->data = $data;
    }
    
    public function required($fields) {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || empty(trim($this->data[$field]))) {
                $this->errors[$field] = ucfirst($field) . ' is required';
            }
        }
        return $this;
    }
    
    public function email($field) {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = 'Invalid email format';
        }
        return $this;
    }
    
    public function min($field, $min) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $min) {
            $this->errors[$field] = ucfirst($field) . " must be at least {$min} characters";
        }
        return $this;
    }
    
    public function max($field, $max) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $max) {
            $this->errors[$field] = ucfirst($field) . " must not exceed {$max} characters";
        }
        return $this;
    }
    
    public function numeric($field) {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = ucfirst($field) . ' must be numeric';
        }
        return $this;
    }
    
    public function phone($field) {
        if (isset($this->data[$field]) && !preg_match('/^[0-9]{10,11}$/', $this->data[$field])) {
            $this->errors[$field] = 'Invalid phone number format';
        }
        return $this;
    }
    
    public function date($field) {
        if (isset($this->data[$field])) {
            $d = DateTime::createFromFormat('Y-m-d', $this->data[$field]);
            if (!$d || $d->format('Y-m-d') !== $this->data[$field]) {
                $this->errors[$field] = 'Invalid date format (YYYY-MM-DD required)';
            }
        }
        return $this;
    }
    
    public function inArray($field, $array) {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $array)) {
            $this->errors[$field] = ucfirst($field) . ' must be one of: ' . implode(', ', $array);
        }
        return $this;
    }
    
    public function custom($field, $callback, $message) {
        if (isset($this->data[$field]) && !$callback($this->data[$field])) {
            $this->errors[$field] = $message;
        }
        return $this;
    }
    
    public function fails() {
        return !empty($this->errors);
    }
    
    public function passes() {
        return empty($this->errors);
    }
    
    public function errors() {
        return $this->errors;
    }
}
