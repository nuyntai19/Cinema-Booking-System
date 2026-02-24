# 📚 HỌC PHP TỪ CON SỐ 0 - DỄ HIỂU CHO NGƯỜI MỚI

> **Mục tiêu:** Giúp bạn hiểu PHP từ cơ bản đến nâng cao, đủ để code backend Galaxy Cinema

---

## 📑 MỤC LỤC

1. [PHP là gì?](#1-php-là-gì)
2. [Cú pháp cơ bản](#2-cú-pháp-cơ-bản)
3. [Biến và kiểu dữ liệu](#3-biến-và-kiểu-dữ-liệu)
4. [Toán tử](#4-toán-tử)
5. [Array (Mảng)](#5-array-mảng)
6. [Điều kiện và vòng lặp](#6-điều-kiện-và-vòng-lặp)
7. [Function (Hàm)](#7-function-hàm)
8. [Class và Object (OOP)](#8-class-và-object-oop)
9. [Toán tử mũi tên -> và ::](#9-toán-tử-mũi-tên---và-)
10. [Xử lý chuỗi](#10-xử-lý-chuỗi)
11. [Include và Require](#11-include-và-require)
12. [Database với PDO](#12-database-với-pdo)
13. [JSON](#13-json)
14. [Các khái niệm quan trọng khác](#14-các-khái-niệm-quan-trọng-khác)

---

## 1. PHP LÀ GÌ?

**PHP** (Hypertext Preprocessor) là ngôn ngữ lập trình chạy trên server (backend).

### So sánh với JavaScript:

| JavaScript                      | PHP                          |
| ------------------------------- | ---------------------------- |
| Chạy trên trình duyệt (client)  | Chạy trên server             |
| `console.log('Hello')`          | `echo 'Hello'`               |
| `let name = 'John'`             | `$name = 'John'`             |
| `function greet() {}`           | `function greet() {}`        |
| `const user = { name: 'John' }` | `$user = ['name' => 'John']` |

### File PHP cơ bản:

```php
<?php
// Mọi code PHP phải nằm trong cặp thẻ <?php ... ?>

echo "Hello World!";
// "echo" giống như console.log() trong JS

?>
```

**Chạy file PHP:** Cần server (XAMPP, WAMP) hoặc lệnh `php filename.php`

---

## 2. CÚ PHÁP CƠ BẢN

### 2.1. Comment (Ghi chú)

```php
<?php
// Comment 1 dòng

/*
   Comment
   nhiều dòng
*/

# Comment kiểu Unix

echo "Hello"; // In ra màn hình
?>
```

### 2.2. Kết thúc câu lệnh

```php
<?php
// Mỗi câu lệnh kết thúc bằng dấu chấm phẩy ;
echo "Dong 1";
echo "Dong 2";

// Không có dấu ; → LỖI!
echo "Dong 3"  // ❌ SAI
?>
```

### 2.3. In ra màn hình

```php
<?php
// Cách 1: echo (dùng nhiều nhất)
echo "Hello World";

// Cách 2: print
print "Hello World";

// Cách 3: var_dump() - hiển thị chi tiết (dùng để debug)
var_dump("Hello");  // string(5) "Hello"

// Cách 4: print_r() - in array/object dễ đọc
print_r(['a', 'b', 'c']);
?>
```

---

## 3. BIẾN VÀ KIỂU DỮ LIỆU

### 3.1. Biến (Variables)

**Biến trong PHP BẮT ĐẦU bằng dấu `$`**

```php
<?php
// Khai báo biến (không cần let, const, var như JS)
$name = "John";
$age = 25;
$price = 99.99;
$isActive = true;

// In biến
echo $name;        // John
echo "Tên: $name"; // Tên: John (tự động thay thế)
?>
```

**Quy tắc đặt tên biến:**

- Bắt đầu bằng `$`
- Sau `$` là chữ cái hoặc `_` (không được số)
- Phân biệt HOA/thường (`$name` ≠ `$Name`)

```php
<?php
// ✅ HỢP LỆ
$userName = "John";
$user_name = "John";
$_private = 123;
$age2 = 25;

// ❌ KHÔNG HỢP LỆ
$2age = 25;        // Bắt đầu bằng số
$user-name = "John"; // Có dấu -
?>
```

### 3.2. Kiểu dữ liệu

```php
<?php
// 1. STRING (Chuỗi)
$name = "John Doe";
$message = 'Hello World';

// 2. INTEGER (Số nguyên)
$age = 25;
$negative = -10;

// 3. FLOAT (Số thực)
$price = 99.99;
$pi = 3.14159;

// 4. BOOLEAN (Đúng/Sai)
$isActive = true;
$isDeleted = false;

// 5. ARRAY (Mảng) - xem phần 5
$colors = ["red", "green", "blue"];

// 6. NULL (Rỗng)
$empty = null;

// 7. OBJECT (Đối tượng) - xem phần 8
$user = new User();

// Kiểm tra kiểu dữ liệu
echo gettype($name);  // string
echo gettype($age);   // integer
?>
```

### 3.3. Nối chuỗi

```php
<?php
$firstName = "John";
$lastName = "Doe";

// Cách 1: Dùng dấu .
$fullName = $firstName . " " . $lastName;
echo $fullName; // John Doe

// Cách 2: Dùng ngoặc kép " (tự động thay biến)
echo "Hello $firstName";     // Hello John
echo "Hello {$firstName}";   // Hello John (rõ ràng hơn)

// Cách 3: Dùng ngoặc đơn ' (KHÔNG thay biến)
echo 'Hello $firstName';     // Hello $firstName (in đúng chữ)
?>
```

---

## 4. TOÁN TỬ

### 4.1. Toán tử số học

```php
<?php
$a = 10;
$b = 3;

echo $a + $b;  // 13 (cộng)
echo $a - $b;  // 7  (trừ)
echo $a * $b;  // 30 (nhân)
echo $a / $b;  // 3.33 (chia)
echo $a % $b;  // 1  (chia lấy dư)
echo $a ** $b; // 1000 (lũy thừa: 10^3)
?>
```

### 4.2. Toán tử so sánh

```php
<?php
$x = 5;
$y = "5";

// Bằng giá trị (không quan tâm kiểu)
echo $x == $y;   // true (5 == "5")

// Bằng giá trị VÀ kiểu
echo $x === $y;  // false (5 !== "5" về kiểu)

// Khác
echo $x != $y;   // false
echo $x !== $y;  // true (khác kiểu)

// Lớn hơn, nhỏ hơn
echo $x > 3;     // true
echo $x < 10;    // true
echo $x >= 5;    // true
?>
```

### 4.3. Toán tử logic

```php
<?php
$age = 20;
$hasTicket = true;

// AND (và) - cả 2 đều đúng
if ($age >= 18 && $hasTicket) {
    echo "Vào được";
}

// OR (hoặc) - 1 trong 2 đúng
if ($age >= 18 || $hasTicket) {
    echo "Có thể vào";
}

// NOT (phủ định)
if (!$hasTicket) {
    echo "Không có vé";
}
?>
```

### 4.4. Toán tử gán

```php
<?php
$x = 10;

$x += 5;  // $x = $x + 5  → 15
$x -= 3;  // $x = $x - 3  → 12
$x *= 2;  // $x = $x * 2  → 24
$x /= 4;  // $x = $x / 4  → 6

$x++;     // $x = $x + 1  → 7
$x--;     // $x = $x - 1  → 6
?>
```

---

## 5. ARRAY (MẢNG)

### 5.1. Array thông thường (như JS)

```php
<?php
// Tạo array
$colors = ["red", "green", "blue"];
$numbers = array(1, 2, 3, 4, 5); // Cách cũ

// Truy cập phần tử (index bắt đầu từ 0)
echo $colors[0]; // red
echo $colors[1]; // green

// Thêm phần tử
$colors[] = "yellow";      // Thêm vào cuối
$colors[5] = "purple";     // Thêm vào vị trí 5

// Đếm số phần tử
echo count($colors); // 5

// Kiểm tra phần tử tồn tại
if (isset($colors[0])) {
    echo "Có phần tử đầu tiên";
}
?>
```

### 5.2. Array kết hợp (Associative Array) - QUAN TRỌNG!

**Giống như Object trong JavaScript**

```php
<?php
// Giống { name: "John", age: 25 } trong JS
$user = [
    "name" => "John Doe",
    "age" => 25,
    "email" => "john@gmail.com"
];

// Truy cập
echo $user["name"];  // John Doe
echo $user["age"];   // 25

// Thêm/sửa
$user["phone"] = "0123456789";
$user["age"] = 26;

// Xóa
unset($user["email"]);
?>
```

### 5.3. Array đa chiều (Nested Array)

```php
<?php
// Array trong array
$users = [
    [
        "name" => "John",
        "age" => 25
    ],
    [
        "name" => "Jane",
        "age" => 22
    ]
];

// Truy cập
echo $users[0]["name"]; // John
echo $users[1]["age"];  // 22
?>
```

### 5.4. Vòng lặp qua Array

```php
<?php
$colors = ["red", "green", "blue"];

// Cách 1: for loop (như JS)
for ($i = 0; $i < count($colors); $i++) {
    echo $colors[$i];
}

// Cách 2: foreach (dễ hơn)
foreach ($colors as $color) {
    echo $color; // red, green, blue
}

// Cách 3: foreach với key và value
$user = [
    "name" => "John",
     "age" => 25
];
foreach ($user as $key => $value) {
    echo "$key: $value"; // name: John, age: 25
}
?>
```

---

## 6. ĐIỀU KIỆN VÀ VÒNG LẶP

### 6.1. If - Else (giống JS)

```php
<?php
$age = 18;

if ($age >= 18) {
    echo "Đủ tuổi";
} elseif ($age >= 13) {
    echo "Thiếu niên";
} else {
    echo "Trẻ em";
}
?>
```

### 6.2. Switch - Case

```php
<?php
$role = "Admin";

switch ($role) {
    case "Admin":
        echo "Quản trị viên";
        break;
    case "Manager":
        echo "Quản lý";
        break;
    case "Staff":
        echo "Nhân viên";
        break;
    default:
        echo "Khách";
}
?>
```

### 6.3. Vòng lặp For

```php
<?php
// In số từ 1 đến 10
for ($i = 1; $i <= 10; $i++) {
    echo $i . " ";
}
?>
```

### 6.4. Vòng lặp While

```php
<?php
$count = 1;
while ($count <= 5) {
    echo $count;
    $count++;
}
?>
```

### 6.5. Vòng lặp Foreach (cho Array)

```php
<?php
$fruits = ["Apple", "Banana", "Orange"];

foreach ($fruits as $fruit) {
    echo $fruit . " ";
}
?>
```

---

## 7. FUNCTION (HÀM)

### 7.1. Khai báo và gọi function

```php
<?php
// Khai báo function (giống JS)
function sayHello() {
    echo "Hello World!";
}

// Gọi function
sayHello(); // Hello World!
?>
```

### 7.2. Function với tham số

```php
<?php
function greet($name) {
    echo "Hello, $name!";
}

greet("John"); // Hello, John!
greet("Jane"); // Hello, Jane!
?>
```

### 7.3. Function với giá trị mặc định

```php
<?php
function greet($name = "Guest") {
    echo "Hello, $name!";
}

greet();        // Hello, Guest!
greet("John");  // Hello, John!
?>
```

### 7.4. Function trả về giá trị

```php
<?php
function add($a, $b) {
    return $a + $b;
}

$result = add(5, 3);
echo $result; // 8
?>
```

### 7.5. Kiểu dữ liệu tham số và return (PHP 7+)

```php
<?php
// Khai báo kiểu dữ liệu (type hinting)
function multiply(int $a, int $b): int {
    return $a * $b;
}

echo multiply(5, 3);    // 15
echo multiply(5, "3");  // 15 (tự động chuyển "3" thành 3)

// Strict types - Bắt buộc đúng kiểu
declare(strict_types=1);

function divide(int $a, int $b): float {
    return $a / $b;
}
?>
```

---

## 8. CLASS VÀ OBJECT (OOP)

### 8.1. Class cơ bản

**Class như một "khuôn mẫu" để tạo Object**

```php
<?php
// Khai báo class
class User {
    // Thuộc tính (properties) - giống biến trong class
    public $name;
    public $age;

    // Phương thức (methods) - giống function trong class
    public function greet() {
        echo "Hello, my name is $this->name";
    }
}

// Tạo object từ class
$user1 = new User();
$user1->name = "John";
$user1->age = 25;
$user1->greet(); // Hello, my name is John

// Tạo object khác
$user2 = new User();
$user2->name = "Jane";
$user2->age = 22;
?>
```

**Giải thích:**

- `class User` - Định nghĩa class tên User
- `public $name` - Thuộc tính công khai
- `$this->name` - Truy cập thuộc tính của chính object đó
- `new User()` - Tạo object mới từ class

### 8.2. Constructor (Hàm khởi tạo)

```php
<?php
class User {
    public $name;
    public $age;

    // Constructor - Tự động chạy khi tạo object
    public function __construct($name, $age) {
        $this->name = $name;
        $this->age = $age;
    }

    public function introduce() {
        echo "Tôi là $this->name, $this->age tuổi";
    }
}

// Tạo object với constructor
$user = new User("John", 25);
$user->introduce(); // Tôi là John, 25 tuổi
?>
```

### 8.3. Access Modifiers (public, private, protected)

```php
<?php
class BankAccount {
    public $accountNumber;     // Ai cũng truy cập được
    private $balance;          // CHỈ trong class này
    protected $bankName;       // Class này và class con

    public function __construct($accountNumber, $balance) {
        $this->accountNumber = $accountNumber;
        $this->balance = $balance;
    }

    // Getter - Lấy giá trị private
    public function getBalance() {
        return $this->balance;
    }

    // Setter - Gán giá trị private
    public function deposit($amount) {
        if ($amount > 0) {
            $this->balance += $amount;
        }
    }
}

$account = new BankAccount("123456", 1000);
echo $account->accountNumber;   // OK - public
// echo $account->balance;      // LỖI - private!
echo $account->getBalance();    // OK - qua method public
?>
```

**Giải thích:**

- `public` - Truy cập mọi nơi
- `private` - Chỉ trong class
- `protected` - Class này và class kế thừa

### 8.4. Static (Thuộc về Class, không thuộc Object)

```php
<?php
class MathHelper {
    // Static property - Thuộc về class
    public static $pi = 3.14159;

    // Static method - Gọi trực tiếp qua class
    public static function add($a, $b) {
        return $a + $b;
    }
}

// Gọi KHÔNG cần tạo object
echo MathHelper::$pi;           // 3.14159
echo MathHelper::add(5, 3);     // 8
?>
```

### 8.5. Kế thừa (Inheritance)

```php
<?php
// Class cha
class Animal {
    public $name;

    public function __construct($name) {
        $this->name = $name;
    }

    public function eat() {
        echo "$this->name đang ăn";
    }
}

// Class con kế thừa Animal
class Dog extends Animal {
    public function bark() {
        echo "$this->name đang sủa: Gâu gâu!";
    }
}

$dog = new Dog("Buddy");
$dog->eat();   // Buddy đang ăn (từ class cha)
$dog->bark();  // Buddy đang sủa: Gâu gâu! (từ class con)
?>
```

---

## 9. TOÁN TỬ MŨI TÊN `->` VÀ `::`

### 9.1. Mũi tên `->` (Object Operator)

**Dùng để truy cập thuộc tính/method của OBJECT**

```php
<?php
class User {
    public $name = "John";

    public function greet() {
        return "Hello!";
    }
}

$user = new User();

// -> Truy cập thuộc tính
echo $user->name;  // John

// -> Gọi method
echo $user->greet(); // Hello!
?>
```

**Tương đương trong JavaScript:**

```javascript
// JavaScript
const user = {
  name: "John",
  greet: function () {
    return "Hello!";
  },
};

console.log(user.name); // Dùng dấu . (chấm)
console.log(user.greet()); // Dùng dấu . (chấm)
```

**Vậy `->` trong PHP = `.` trong JavaScript!**

### 9.2. Hai dấu hai chấm `::` (Scope Resolution Operator)

**Dùng để truy cập thuộc tính/method STATIC của CLASS**

```php
<?php
class Config {
    public static $siteName = "Galaxy Cinema";

    public static function getVersion() {
        return "1.0.0";
    }
}

// :: Truy cập static property
echo Config::$siteName;  // Galaxy Cinema (CHÚ Ý: có dấu $)

// :: Gọi static method
echo Config::getVersion(); // 1.0.0 (KHÔNG có dấu $)
?>
```

**Khi nào dùng `->` và `::`?**

```php
<?php
class Example {
    public $normalVar = "Normal";
    public static $staticVar = "Static";

    public function normalMethod() {
        return "Normal method";
    }

    public static function staticMethod() {
        return "Static method";
    }
}

// CẦN tạo object → dùng ->
$obj = new Example();
echo $obj->normalVar;       // ✅
echo $obj->normalMethod();  // ✅

// KHÔNG cần object → dùng ::
echo Example::$staticVar;       // ✅
echo Example::staticMethod();   // ✅

// ❌ SAI
echo Example->normalVar;        // LỖI!
echo $obj::normalMethod();      // LỖI!
?>
```

**Tóm tắt:**

- `->` = Dùng cho **object** (đã new)
- `::` = Dùng cho **class** (không cần new, static)

### 9.3. `$this` và `self`

```php
<?php
class Product {
    public $name;
    public static $count = 0;

    public function __construct($name) {
        $this->name = $name;      // $this-> Truy cập thuộc tính object
        self::$count++;           // self:: Truy cập thuộc tính static
    }

    public function showName() {
        echo $this->name;         // $this-> trong method
    }

    public static function showCount() {
        echo self::$count;        // self:: trong static method
    }
}

$p1 = new Product("Laptop");
$p2 = new Product("Phone");

$p1->showName();          // Laptop ($this)
Product::showCount();     // 2 (self)
?>
```

---

## 10. XỬ LÝ CHUỖI

```php
<?php
$text = "Hello World";

// Độ dài
echo strlen($text);  // 11

// Chuyển HOA/thường
echo strtoupper($text); // HELLO WORLD
echo strtolower($text); // hello world

// Thay thế
echo str_replace("World", "PHP", $text); // Hello PHP

// Tìm vị trí
echo strpos($text, "World"); // 6

// Cắt chuỗi
echo substr($text, 0, 5); // Hello

// Tách chuỗi thành array
$words = explode(" ", $text); // ["Hello", "World"]

// Nối array thành chuỗi
$joined = implode("-", $words); // Hello-World

// Trim (xóa khoảng trắng 2 đầu)
$messy = "  text  ";
echo trim($messy); // "text"
?>
```

---

## 11. INCLUDE VÀ REQUIRE

**Dùng để nhúng code từ file khác vào**

```php
<?php
// file: config.php
$dbHost = "localhost";
$dbName = "galaxy_cinema";
?>

<?php
// file: index.php
include 'config.php';  // Nhúng file config.php
echo $dbHost;          // localhost (dùng được biến từ config.php)
?>
```

**4 cách include:**

```php
<?php
// 1. include - Nếu file không tồn tại → cảnh báo, tiếp tục chạy
include 'file.php';

// 2. require - Nếu file không tồn tại → LỖI, dừng chương trình
require 'file.php';

// 3. include_once - Include 1 lần duy nhất (tránh trùng)
include_once 'file.php';

// 4. require_once - Require 1 lần duy nhất (khuyên dùng)
require_once 'file.php';
?>
```

---

## 12. DATABASE VỚI PDO

### 12.1. Kết nối Database

```php
<?php
try {
    // Tạo kết nối PDO
    $db = new PDO(
        'mysql:host=localhost;dbname=galaxy_cinema;charset=utf8mb4',
        'root',      // username
        ''           // password
    );

    // Bật chế độ báo lỗi
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Kết nối thành công!";

} catch (PDOException $e) {
    die("Lỗi kết nối: " . $e->getMessage());
}
?>
```

### 12.2. Truy vấn SELECT

```php
<?php
// Query đơn giản
$sql = "SELECT * FROM movies";
$stmt = $db->query($sql);
$movies = $stmt->fetchAll(PDO::FETCH_ASSOC);

// In kết quả
foreach ($movies as $movie) {
    echo $movie['title'] . "<br>";
}
?>
```

### 12.3. Prepared Statement (QUAN TRỌNG - Tránh SQL Injection)

```php
<?php
// ❌ SAI - Dễ bị SQL Injection
$email = $_POST['email'];
$sql = "SELECT * FROM users WHERE email = '$email'";
// Hacker có thể gửi: email = "' OR '1'='1"

// ✅ ĐÚNG - Prepared Statement
$email = $_POST['email'];
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $db->prepare($sql);
$stmt->execute([$email]);  // Tự động escape
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Hoặc dùng named parameters
$sql = "SELECT * FROM users WHERE email = :email AND status = :status";
$stmt = $db->prepare($sql);
$stmt->execute([
    ':email' => $email,
    ':status' => 'active'
]);
?>
```

### 12.4. INSERT, UPDATE, DELETE

```php
<?php
// INSERT
$sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
$stmt = $db->prepare($sql);
$stmt->execute(["John Doe", "john@gmail.com", password_hash("123456", PASSWORD_BCRYPT)]);

// UPDATE
$sql = "UPDATE users SET name = ? WHERE id = ?";
$stmt = $db->prepare($sql);
$stmt->execute(["John Smith", 5]);

// DELETE
$sql = "DELETE FROM users WHERE id = ?";
$stmt = $db->prepare($sql);
$stmt->execute([5]);

// Lấy số dòng bị ảnh hưởng
echo $stmt->rowCount(); // Số dòng đã thay đổi
?>
```

### 12.5. Transaction (Giao dịch)

```php
<?php
try {
    // Bắt đầu transaction
    $db->beginTransaction();

    // Nhiều query liên quan
    $db->query("UPDATE account SET balance = balance - 100 WHERE id = 1");
    $db->query("UPDATE account SET balance = balance + 100 WHERE id = 2");

    // Commit - Lưu thay đổi
    $db->commit();

} catch (Exception $e) {
    // Rollback - Hủy tất cả thay đổi nếu có lỗi
    $db->rollBack();
    echo "Lỗi: " . $e->getMessage();
}
?>
```

---

## 13. JSON

```php
<?php
// Array PHP → JSON
$user = [
    "name" => "John",
    "age" => 25,
    "email" => "john@gmail.com"
];
$json = json_encode($user);
echo $json; // {"name":"John","age":25,"email":"john@gmail.com"}

// JSON → Array PHP
$jsonString = '{"name":"Jane","age":22}';
$data = json_decode($jsonString, true); // true = array, false = object
echo $data['name']; // Jane

// JSON → Object PHP
$obj = json_decode($jsonString);
echo $obj->name; // Jane
?>
```

---

## 14. CÁC KHÁI NIỆM QUAN TRỌNG KHÁC

### 14.1. Superglobals (Biến toàn cục)

```php
<?php
// $_GET - Lấy dữ liệu từ URL
// URL: page.php?name=John&age=25
echo $_GET['name']; // John
echo $_GET['age'];  // 25

// $_POST - Lấy dữ liệu từ form
// <form method="POST">
//   <input name="email" value="john@gmail.com">
// </form>
echo $_POST['email']; // john@gmail.com

// $_SERVER - Thông tin server
echo $_SERVER['REQUEST_METHOD'];  // GET hoặc POST
echo $_SERVER['REQUEST_URI'];     // /api/movies/123

// $_SESSION - Lưu dữ liệu giữa các trang
session_start();
$_SESSION['user_id'] = 5;
echo $_SESSION['user_id']; // 5

// $_COOKIE - Cookie
setcookie('username', 'John', time() + 3600); // Lưu 1 giờ
echo $_COOKIE['username']; // John

// $_FILES - Upload file
// <input type="file" name="avatar">
$file = $_FILES['avatar'];
echo $file['name'];  // tên file
echo $file['size'];  // kích thước
?>
```

### 14.2. Error Handling

```php
<?php
// try-catch
try {
    // Code có thể lỗi
    $result = 10 / 0;

} catch (Exception $e) {
    // Xử lý lỗi
    echo "Lỗi: " . $e->getMessage();

} finally {
    // Luôn chạy (có lỗi hay không)
    echo "Dọn dẹp...";
}

// Tự throw Exception
function divide($a, $b) {
    if ($b == 0) {
        throw new Exception("Không thể chia cho 0");
    }
    return $a / $b;
}
?>
```

### 14.3. Namespace (Không gian tên)

```php
<?php
// file: App/Controllers/UserController.php
namespace App\Controllers;

class UserController {
    public function index() {
        echo "User list";
    }
}

// file: index.php
use App\Controllers\UserController;

$controller = new UserController();
$controller->index();
?>
```

### 14.4. Autoload (Tự động load class)

```php
<?php
// Khi gọi new UserController(), PHP tự tìm file controllers/UserController.php
spl_autoload_register(function ($className) {
    $file = str_replace('\\', '/', $className) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// Giờ có thể dùng class mà không cần require
$controller = new UserController(); // Tự động load!
?>
```

---

## 15. ÁP DỤNG VÀO PROJECT GALAXY CINEMA

### Ví dụ 1: Database Singleton

```php
<?php
class Database {
    private static $instance = null;  // static = thuộc class
    private $connection;

    // private constructor = không cho new từ ngoài
    private function __construct() {
        $this->connection = new PDO(
            'mysql:host=localhost;dbname=galaxy_cinema',
            'root',
            ''
        );
    }

    // static method = gọi trực tiếp qua class
    public static function getInstance() {
        if (self::$instance === null) {       // self:: = truy cập static
            self::$instance = new Database(); // Chỉ tạo 1 lần
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;  // $this-> = object hiện tại
    }
}

// Sử dụng
$db = Database::getInstance()->getConnection(); // :: gọi static method
$stmt = $db->query("SELECT * FROM movies");     // -> gọi method của object
?>
```

### Ví dụ 2: JWT Class

```php
<?php
class JWT {
    public static function encode($payload, $secret) {
        // Mã hóa dữ liệu thành token
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64Header = base64_encode($header);
        $base64Payload = base64_encode($payload);

        $signature = hash_hmac('sha256',
                              $base64Header . '.' . $base64Payload,
                              $secret,
                              true);
        $base64Signature = base64_encode($signature);

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    public static function decode($jwt, $secret) {
        // Giải mã token
        $parts = explode('.', $jwt);
        $payload = json_decode(base64_decode($parts[1]), true);
        return $payload;
    }
}

// Sử dụng
$payload = ['user_id' => 5, 'role' => 'Member'];
$token = JWT::encode($payload, 'secret_key');  // Static method, dùng ::
echo $token;
?>
```

### Ví dụ 3: Validator Class

```php
<?php
class Validator {
    private $data;
    private $errors = [];

    public function __construct($data) {
        $this->data = $data;  // $this-> = thuộc tính object
    }

    public function required($fields) {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
                $this->errors[$field] = "Trường $field là bắt buộc";
            }
        }
        return $this; // Return $this để chain: ->required()->email()
    }

    public function email($field) {
        if (isset($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = "Email không hợp lệ";
            }
        }
        return $this;
    }

    public function fails() {
        return !empty($this->errors);
    }

    public function errors() {
        return $this->errors;
    }
}

// Sử dụng (method chaining)
$validator = new Validator($_POST);
$validator->required(['email', 'password'])
          ->email('email');

if ($validator->fails()) {
    print_r($validator->errors());
}
?>
```

---

## 16. TIPS & TRICKS

### 16.1. Null Coalescing Operator (??)

```php
<?php
// Thay vì:
$name = isset($_GET['name']) ? $_GET['name'] : 'Guest';

// Dùng ??
$name = $_GET['name'] ?? 'Guest';  // Ngắn gọn hơn!
?>
```

### 16.2. Spaceship Operator (<=>)

```php
<?php
// So sánh 3 chiều
echo 5 <=> 3;  // 1  (5 > 3)
echo 5 <=> 5;  // 0  (5 == 5)
echo 3 <=> 5;  // -1 (3 < 5)
?>
```

### 16.3. Arrow Functions (PHP 7.4+)

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// Thay vì:
$doubled = array_map(function($n) {
    return $n * 2;
}, $numbers);

// Dùng arrow function
$doubled = array_map(fn($n) => $n * 2, $numbers);
?>
```

---

## 📝 BÀI TẬP THỰC HÀNH

### Bài 1: Tạo class User với OOP

```php
<?php
class User {
    private $id;
    private $name;
    private $email;

    public function __construct($id, $name, $email) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
    }

    public function getName() {
        return $this->name;
    }

    public function getEmail() {
        return $this->email;
    }

    public function toArray() {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email
        ];
    }
}

// Test
$user = new User(1, "John Doe", "john@gmail.com");
echo $user->getName();
print_r($user->toArray());
?>
```

### Bài 2: Viết function tính tổng tiền vé

```php
<?php
function calculateTicketPrice($seatType, $isWeekend) {
    $basePrice = 75000;

    // Hệ số loại ghế
    $multiplier = 1;
    if ($seatType === 'VIP') {
        $multiplier = 1.5;
    } elseif ($seatType === 'Sweetbox') {
        $multiplier = 2;
    }

    // Tăng giá cuối tuần
    if ($isWeekend) {
        $multiplier += 0.1;
    }

    return $basePrice * $multiplier;
}

echo calculateTicketPrice('Standard', false); // 75000
echo calculateTicketPrice('VIP', true);       // 120000
?>
```

### Bài 3: Query database lấy danh sách phim

```php
<?php
$db = new PDO('mysql:host=localhost;dbname=galaxy_cinema', 'root', '');

function getMovies($db, $status = null) {
    if ($status) {
        $sql = "SELECT * FROM movies WHERE status = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$status]);
    } else {
        $sql = "SELECT * FROM movies";
        $stmt = $db->query($sql);
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Lấy tất cả phim
$allMovies = getMovies($db);

// Lấy phim đang chiếu
$nowShowing = getMovies($db, 'Now Showing');

foreach ($nowShowing as $movie) {
    echo $movie['title'] . "<br>";
}
?>
```

---

## 🎯 CHECKLIST HỌC PHP

- [ ] Hiểu cú pháp cơ bản (echo, comment, ;)
- [ ] Hiểu biến bắt đầu bằng `$`
- [ ] Biết các kiểu dữ liệu (string, int, float, bool, array)
- [ ] Hiểu array thông thường và array kết hợp
- [ ] Hiểu if-else, for, foreach
- [ ] Biết viết function
- [ ] Hiểu class và object cơ bản
- [ ] Hiểu sự khác biệt `->` và `::`
- [ ] Hiểu `$this` và `self`
- [ ] Biết kết nối database với PDO
- [ ] Hiểu prepared statement (tránh SQL injection)
- [ ] Biết xử lý JSON

---

## 🚀 NEXT STEPS

1. **Đọc lại file này 2-3 lần** - Nắm vững khái niệm
2. **Thực hành code** - Tạo file test.php và thử từng đoạn code
3. **Đọc lại BACKEND_ARCHITECTURE_EXPLAINED.md** - Giờ sẽ hiểu rõ hơn!
4. **Bắt đầu code Controller đầu tiên** - AuthController.php
5. **Hỏi ngay khi chưa hiểu** - Đừng ngồi nghĩ một mình quá lâu

---

## 💡 LỜI KHUYÊN

- **PHP không khó như bạn nghĩ!** Nếu biết JavaScript, học PHP rất nhanh
- **Thực hành nhiều hơn đọc** - Code mỗi ngày, dù chỉ 30 phút
- **Debug bằng var_dump()** - In ra để xem giá trị biến
- **Google là bạn** - Mọi lỗi đều có người gặp và giải quyết rồi
- **Đọc code người khác** - Học từ code mẫu trong project

**Chúc bạn học tốt! 💪**

_"Everyone who codes is a beginner at some point. Don't give up!"_
