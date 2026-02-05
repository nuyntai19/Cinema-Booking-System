<?php
/**
 * Router - Handle HTTP Routing
 */
class Router {
    private $routes = [];
    private $middlewares = [];
    
    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }
    
    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }
    
    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }
    
    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    private function addRoute($method, $path, $handler) {
        // Convert :param to regex pattern
        $pattern = preg_replace('/:\w+/', '([^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => $pattern,
            'handler' => $handler
        ];
    }
    
    public function addMiddleware($middleware) {
        $this->middlewares[] = $middleware;
    }
    
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remove trailing slash
        $uri = rtrim($uri, '/');
        
        // Run middlewares
        foreach ($this->middlewares as $middleware) {
            if (is_callable($middleware)) {
                $middleware();
            }
        }
        
        // Find matching route
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                array_shift($matches); // Remove full match
                
                $handler = $route['handler'];
                
                // Extract parameters from path
                $params = $this->extractParams($route['path'], $uri);
                
                // Handle closure
                if (is_callable($handler)) {
                    return call_user_func_array($handler, $matches);
                }
                
                // Handle Controller@method format
                if (is_string($handler) && strpos($handler, '@') !== false) {
                    list($controller, $method) = explode('@', $handler);
                    
                    if (class_exists($controller)) {
                        $controllerInstance = new $controller();
                        
                        if (method_exists($controllerInstance, $method)) {
                            return call_user_func_array(
                                [$controllerInstance, $method],
                                $params
                            );
                        }
                    }
                }
                
                Response::error('Handler not found', 500);
                return;
            }
        }
        
        // No route found
        Response::error('Route not found', 404);
    }
    
    private function extractParams($pattern, $uri) {
        $patternParts = explode('/', trim($pattern, '/'));
        $uriParts = explode('/', trim($uri, '/'));
        
        $params = [];
        
        foreach ($patternParts as $index => $part) {
            if (strpos($part, ':') === 0) {
                $paramName = substr($part, 1);
                $params[$paramName] = $uriParts[$index] ?? null;
            }
        }
        
        return $params;
    }
}
