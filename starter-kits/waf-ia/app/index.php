<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'status' => 'permitida',
  'message' => 'A requisição passou pelo WAF e chegou à aplicação PHP.',
  'path' => $_SERVER['REQUEST_URI'] ?? '/api/'
], JSON_UNESCAPED_UNICODE);
