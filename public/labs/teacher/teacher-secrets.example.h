#pragma once

// Copy to teacher-secrets.h beside the Lab 3 sketch, on the teacher's computer.
// Use the real ESP32 board. Do not publish or paste this file into Wokwi.
constexpr char FEEDER_WIFI_SSID[] = "YOUR_2_4_GHZ_SSID";
constexpr char FEEDER_WIFI_PASSWORD[] = "YOUR_WIFI_PASSWORD";
constexpr char TELEGRAM_TOKEN[] = "YOUR_BOT_TOKEN";
constexpr char TELEGRAM_CHAT_ID[] = "YOUR_CHAT_ID";
constexpr char TELEGRAM_ROOT_CA[] = R"PEM(
-----BEGIN CERTIFICATE-----
PASTE_THE_TRUSTED_ROOT_CA_FOR_API_TELEGRAM_ORG
-----END CERTIFICATE-----
)PEM";
