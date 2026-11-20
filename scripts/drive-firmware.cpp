#include <emscripten.h>
#include <cstdarg>
#include <cstdio>
#include <cstring>
#include <string>

EM_JS(void, traceLine, (int line), { Module.trace(line); });

EM_JS(unsigned long, millis, (), { return (Module.timingClock || Module.clock)(); });
EM_JS(unsigned long, turnMs, (), { return Module.turnMs(); });
EM_JS(int, obstacleAhead, (), { return Module.sensor("ahead"); });
EM_JS(int, takeTurnMarker, (), { return Module.sensor("turn"); });
EM_JS(int, adjacentLaneClear, (), { return Module.sensor("side"); });
EM_JS(void, followTrack, (), { Module.motor("follow"); });
EM_JS(void, turnLeft, (unsigned long hold), { Module.motor("curve", hold); });
EM_JS(void, resumeTurnLeft, (), { Module.motor("curve"); });
EM_JS(void, dodgeRight, (int step), { Module.motor("right", step); });
EM_JS(void, dodgeLeft, (), { Module.motor("left"); });
EM_JS(void, brake, (), { Module.motor("brake"); });
namespace blocking {
EM_ASYNC_JS(void, delay, (unsigned long duration), { if (duration > 0) await Module.sleep(duration); });
}

EM_JS(int, motorMode, (), { return Module.telemetry("motorMode"); });
EM_JS(float, laneRadius, (), { return Module.telemetry("laneRadius"); });
EM_JS(float, requestedSpeed, (), { return Module.telemetry("requestedSpeed"); });
EM_JS(float, wheelSpeed, (), { return Module.telemetry("wheelSpeed"); });
EM_JS(float, laneError, (), { return Module.telemetry("laneError"); });
EM_JS(float, headingError, (), { return Module.telemetry("headingError"); });
EM_JS(float, trackCurvature, (), { return Module.telemetry("trackCurvature"); });
EM_JS(int, ledcWrite, (int pin, int duty), { return Module.pwm(pin, duty); });

namespace timing_io {
using String = std::string;
enum { LOW, HIGH, OUTPUT };
EM_JS(void, pinMode, (int pin, int mode), { if (mode == 2) Module.timingOutput(pin); });
EM_JS(void, digitalWrite, (int pin, int high), { Module.timingWrite(pin, high); });
EM_JS(void, serialLine, (unsigned long value), { Module.timingSerial(value); });
EM_JS(void, serialChunk, (const char *chunk, int size), {
  Module.serialWrite(UTF8ToString(chunk, size));
});
EM_ASYNC_JS(void, timingText, (int line, const char *value), {
  await Module.timingStatement(line, UTF8ToString(value));
});
EM_ASYNC_JS(void, timingTextNumber, (int line, const char *text, double number), {
  await Module.timingTextNumber(line, UTF8ToString(text), number);
});
EM_ASYNC_JS(void, timingStatement, (int line, double value), {
  await Module.timingStatement(line, value);
});
EM_ASYNC_JS(void, timingCall, (int line), { await Module.timingCall(line); });
template<typename T> T timingReturn(int line, T value) {
  timingStatement(line, value);
  return value;
}
String timingReturn(int line, String value) {
  timingText(line, value.c_str());
  return value;
}
EM_ASYNC_JS(void, timingDelay, (unsigned long duration, int line), {
  await Module.timingDelay(line, duration);
});

struct SerialPort {
  void begin(int baud) {}
  void println(unsigned long value) { serialLine(value); }
  void print(const char *text) { serialChunk(text, std::strlen(text)); }
  void print(int value) { printf("%d", value); }
  void println(const char *text) { printf("%s\r\n", text); }
  void println(double value, int places) { printf("%.*f\r\n", places, value); }

  void printf(const char *format, ...) {
    char text[128];
    va_list values;
    va_start(values, format);
    const int length = std::vsnprintf(text, sizeof text, format, values);
    va_end(values);
    if (length > 0) serialChunk(text, length < sizeof text ? length : sizeof text - 1);
  }
};
SerialPort Serial;
}

// TIMING_SKETCHES

extern "C" EMSCRIPTEN_KEEPALIVE void runTimingLesson(int mode) {
  if (mode == 0) {
    timing_blocking::showGlobals();
    timing_blocking::setup();
    for (;;) timing_blocking::loop();
  }
  if (mode == 2) {
    serial_monitor::showGlobals();
    serial_monitor::setup();
    for (;;) serial_monitor::loop();
  }
  if (mode == 3) {
    function_return::showGlobals();
    function_return::setup();
    for (;;) function_return::loop();
  }
  if (mode == 4) {
    function_reference::showGlobals();
    function_reference::setup();
    for (;;) function_reference::loop();
  }
  if (mode == 5) {
    function_void::showGlobals();
    function_void::setup();
    for (;;) function_void::loop();
  }
  timing_polling::showGlobals();
  timing_polling::setup();
  for (;;) timing_polling::loop();
}

// SKETCHES

static int controller;

extern "C" EMSCRIPTEN_KEEPALIVE void setupController(int id) {
  controller = id;
  if (id == 0) blocking::setup();
  else polling::setup();
}

extern "C" EMSCRIPTEN_KEEPALIVE void stepController() {
  if (controller == 0) blocking::loop();
  else polling::loop();
}

extern "C" EMSCRIPTEN_KEEPALIVE void stepMotors() {
  steering::updateMotors();
}
