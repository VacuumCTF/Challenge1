<?php
$key = "ThisIsTheKey1234";

function encodeData($data, $key) {
    return bin2hex(openssl_encrypt($data, "aes-128-ecb", $key, OPENSSL_RAW_DATA));
}

$block = "admin=1" . str_repeat(chr(9), 9);
$enc_block = encodeData($block, $key);
echo $enc_block;
?>