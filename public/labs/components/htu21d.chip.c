#include "wokwi-api.h"
#include <stdint.h>
#include <stdlib.h>

typedef struct {
  uint32_t humidityAttr;
  uint8_t command;
  uint8_t bytes[3];
  uint8_t offset;
} Htu21d;

static uint8_t crc8(uint8_t high, uint8_t low) {
  const uint8_t bytes[] = {high, low};
  uint8_t crc = 0;
  for (unsigned byte = 0; byte < sizeof(bytes); ++byte) {
    crc ^= bytes[byte];
    for (unsigned bit = 0; bit < 8; ++bit) {
      crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : crc << 1;
    }
  }
  return crc;
}

static bool connect(void *user, uint32_t address, bool reading) {
  (void)address;
  Htu21d *chip = user;
  chip->offset = 0;
  if (!reading) return true;
  if (chip->command == 0xE7) {
    chip->bytes[0] = 0x02;  // User register after reset.
    return true;
  }
  if (chip->command != 0xF5 && chip->command != 0xE5) return false;
  uint32_t humidity = attr_read(chip->humidityAttr);
  if (humidity > 100) humidity = 100;
  // Encode the slider in the 12-bit RH field. Round up so a threshold
  // set to the same whole percent also matches in the sketch.
  uint16_t raw = (((humidity + 6) * 16384u + 124u) / 125u) << 2;
  chip->bytes[0] = raw >> 8;
  chip->bytes[1] = (raw & 0xFC) | 0x02;
  chip->bytes[2] = crc8(chip->bytes[0], chip->bytes[1]);
  return true;
}

static bool write_byte(void *user, uint8_t value) {
  Htu21d *chip = user;
  chip->command = value;
  return value == 0xF5 || value == 0xE5 || value == 0xE7 || value == 0xFE;
}

static uint8_t read_byte(void *user) {
  Htu21d *chip = user;
  return chip->offset < sizeof(chip->bytes) ? chip->bytes[chip->offset++] : 0xff;
}

void chip_init(void) {
  Htu21d *chip = calloc(1, sizeof(Htu21d));
  chip->humidityAttr = attr_init("humidity", 55);
  pin_init("VCC", INPUT);
  pin_init("GND", INPUT);
  i2c_config_t i2c = {
    .address = 0x40,
    .sda = pin_init("SDA", INPUT_PULLUP),
    .scl = pin_init("SCL", INPUT_PULLUP),
    .connect = connect,
    .write = write_byte,
    .read = read_byte,
    .user_data = chip,
  };
  i2c_init(&i2c);
}
