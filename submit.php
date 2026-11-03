<?php
// submit.php - receives the form data, validates it, sends back JSON

header('Content-Type: application/json');

// Cloud servers usually run on UTC, so set the timezone for the "Submitted on" time
date_default_timezone_set('Asia/Kolkata');

// Only accept POST requests (not someone just opening the URL)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'errors' => ['name' => 'Invalid request.']]);
    exit;
}

// Read one value safely (trimmed text, or '' if missing / not plain text)
function field($key) {
    return (isset($_POST[$key]) && is_string($_POST[$key])) ? trim($_POST[$key]) : '';
}

$name     = field('name');
$usn      = strtoupper(field('usn'));     // USN is always stored in CAPITALS
$email    = strtolower(field('email'));   // Gmail is always stored in small letters
$sem      = field('sem');
$division = field('division');
$cgpa     = field('cgpa');
$phone    = field('phone');

$errors = [];   // we collect all problems here

// Name: letters, spaces, dots, apostrophes, hyphens (2 to 50 characters)
if ($name === '') {
    $errors['name'] = 'Name is required.';
} elseif (!preg_match("/^[A-Za-z][A-Za-z .'-]{1,49}$/", $name)) {
    $errors['name'] = 'Name must contain letters only (2 to 50 characters).';
}

// USN: 1 digit + 2 letters + 2 digits + 2 letters + 3 digits (example: 2KE24CS039)
if ($usn === '') {
    $errors['usn'] = 'USN is required.';
} elseif (strlen($usn) !== 10) {
    $errors['usn'] = 'USN must be exactly 10 characters, like 2KE24CS039.';
} elseif (!preg_match('/^\d[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/', $usn)) {
    $errors['usn'] = 'Invalid USN. Use the format 2KE24CS039 (digit, 2 letters, 2 digits, 2 letters, 3 digits).';
}

// Gmail: username@gmail.com, username 6-30 chars (letters, numbers, dots; no leading/trailing/double dots)
if ($email === '') {
    $errors['email'] = 'Gmail address is required.';
} elseif (!preg_match('/^[^@\s]+@gmail\.com$/', $email)) {
    $errors['email'] = 'Enter a valid Gmail address ending with @gmail.com.';
} else {
    $user = substr($email, 0, -10);   // everything before "@gmail.com"
    if (!preg_match('/^[a-z0-9.]{6,30}$/', $user) || preg_match('/^\.|\.$|\.\./', $user)) {
        $errors['email'] = 'Gmail username must be 6-30 characters (letters, numbers, dots; no dot at the start, end or twice in a row).';
    }
}

// Semester must be a number from 1 to 8
if ($sem === '') {
    $errors['sem'] = 'Please select a semester.';
} elseif (!preg_match('/^[1-8]$/', $sem)) {
    $errors['sem'] = 'Semester must be between 1 and 8.';
}

// Division must be one of A-D
if ($division === '') {
    $errors['division'] = 'Please select a division.';
} elseif (!in_array($division, ['A', 'B', 'C', 'D'], true)) {
    $errors['division'] = 'Division must be A, B, C or D.';
}

// CGPA: number like 8 or 8.45, max 10
if ($cgpa === '') {
    $errors['cgpa'] = 'CGPA is required.';
} elseif (!preg_match('/^\d{1,2}(\.\d{1,2})?$/', $cgpa)) {
    $errors['cgpa'] = 'CGPA must be a number like 8 or 8.45.';
} elseif ((float)$cgpa > 10) {
    $errors['cgpa'] = 'CGPA cannot be more than 10.';
}

// Phone: exactly 10 digits, starting with 6-9 (Indian mobile format)
if ($phone === '') {
    $errors['phone'] = 'Phone number is required.';
} elseif (!preg_match('/^\d{10}$/', $phone)) {
    $errors['phone'] = 'Phone number must be exactly 10 digits.';
} elseif (!preg_match('/^[6-9]/', $phone)) {
    $errors['phone'] = 'Phone number must start with 6, 7, 8 or 9.';
}

// If anything failed, send the errors back and stop
if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Everything is valid - send the data back for display.
// (We are not saving to a database here; you can add MySQL later.)
echo json_encode([
    'success' => true,
    'data' => [
        'name'     => $name,
        'usn'      => $usn,
        'email'    => $email,
        'sem'      => $sem,
        'division' => $division,
        'cgpa'     => number_format((float)$cgpa, 2),
        'phone'    => $phone,
        'time'     => date('d M Y, h:i A')
    ]
]);
