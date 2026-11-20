import {driveCourse} from './drive-model.js';

// Trace comments mark executable lines without changing the displayed C++.
const dodgeTiming = `const unsigned long RIGHT_MS = ${driveCourse.dodgeRightMs};
const unsigned long LEFT_MS = ${driveCourse.dodgeLeftMs};`;

const sketches = {
  delay:`${dodgeTiming}

void dodgeObstacle() {
  /*trace*/ dodgeRight(1); // ออกจากเลน
  /*trace*/ delay(RIGHT_MS);
  /*trace*/ dodgeLeft();   // กลับเข้าหาเลนเดิม
  /*trace*/ delay(LEFT_MS);
  /*trace*/ dodgeRight(3); // จัดหัวรถให้ตรงกับเลน
  /*trace*/ delay(RIGHT_MS);
}

void setup() {
  /*trace*/ followTrack();
}

void loop() {
  if (/*trace*/ obstacleAhead()) {
    if (/*trace*/ adjacentLaneClear()) {
      /*trace*/ dodgeObstacle();
      /*trace*/ followTrack();
    } else {
      /*trace*/ brake();
    }
    return;
  }

  if (/*trace*/ takeTurnMarker()) {
    /*trace*/ const unsigned long hold = turnMs();
    /*trace*/ turnLeft(hold);
    /*trace*/ delay(hold);
  }
  /*trace*/ followTrack();
}`,

  millis:`${dodgeTiming}

unsigned long turnStarted;
unsigned long turnHold;
bool turning = false;
unsigned long dodgeStarted;
int dodgeStep = 0;

void updateDodge(unsigned long now) {
  /*trace*/ const unsigned long hold = dodgeStep == 2 ? LEFT_MS : RIGHT_MS;
  if (/*trace*/ now - dodgeStarted < hold) return;

  /*trace*/ dodgeStarted = now;
  if (/*trace*/ dodgeStep == 1) {
    /*trace*/ dodgeLeft();
    /*trace*/ dodgeStep = 2;
  } else if (/*trace*/ dodgeStep == 2) {
    /*trace*/ dodgeRight(3);
    /*trace*/ dodgeStep = 3;
  } else {
    /*trace*/ dodgeStep = 0;
    if (/*trace*/ turning && now - turnStarted < turnHold) {
      /*trace*/ resumeTurnLeft();
    } else {
      /*trace*/ turning = false;
      /*trace*/ followTrack();
    }
  }
}

void setup() {
  /*trace*/ followTrack();
}

void loop() {
  /*trace*/ const unsigned long now = millis();
  /*trace*/ const bool blocked = obstacleAhead();
  if (/*trace*/ dodgeStep != 0) {
    /*trace*/ updateDodge(now);
    return;
  }
  if (/*trace*/ blocked) {
    if (/*trace*/ adjacentLaneClear()) {
      /*trace*/ dodgeRight(1);
      /*trace*/ dodgeStarted = now;
      /*trace*/ dodgeStep = 1;
    } else {
      /*trace*/ brake();
    }
    return;
  }

  if (/*trace*/ turning && now - turnStarted >= turnHold) {
    /*trace*/ turning = false;
    /*trace*/ followTrack();
  }
  if (/*trace*/ !turning && takeTurnMarker()) {
    /*trace*/ turnHold = turnMs();
    /*trace*/ turnStarted = now;
    /*trace*/ turning = true;
    /*trace*/ turnLeft(turnHold);
  } else if (/*trace*/ !turning) {
    /*trace*/ followTrack();
  }
}`,

  motor:`const int LEFT_PWM = 25;
const int RIGHT_PWM = 26;
const float MAX_WHEEL_SPEED = ${driveCourse.maxWheelSpeed.toFixed(1)}; // m/s
const float HALF_AXLE = ${(driveCourse.axleWidth/2).toFixed(2)}; // m
const float CURVE_RATE = ${(Math.PI/(driveCourse.turnDuration/1000)).toFixed(6)}f; // rad/s
const float DODGE_RATE = ${driveCourse.dodgeRate.toFixed(2)}f; // rad/s

enum MotorMode { FOLLOW, TURN_LEFT, DODGE_RIGHT, DODGE_LEFT };

int limitPwm(int duty) {
  /*trace*/ return duty < 0 ? 0 : (duty > 255 ? 255 : duty);
}

void driveMotors(int left, int right) {
  /*trace*/ left = limitPwm(left);
  /*trace*/ right = limitPwm(right);
  /*trace*/ ledcWrite(LEFT_PWM, left);
  /*trace*/ ledcWrite(RIGHT_PWM, right);
}

void steer(float speed, float turnRate) {
  /*trace*/ int throttle = int(speed * 255 / MAX_WHEEL_SPEED + 0.5f);
  /*trace*/ float scaled = turnRate * HALF_AXLE * 255 / MAX_WHEEL_SPEED;
  /*trace*/ int correction = int(scaled + (scaled < 0 ? -0.5f : 0.5f));
  /*trace*/ driveMotors(throttle + correction, throttle - correction);
}

void updateMotors() {
  /*trace*/ const float speed = requestedSpeed();
  if (/*trace*/ speed == 0) {
    /*trace*/ driveMotors(0, 0);
    return;
  }

  /*trace*/ const int mode = motorMode();
  if (/*trace*/ mode == TURN_LEFT) {
    /*trace*/ steer(laneRadius() * CURVE_RATE, -CURVE_RATE);
    return;
  }
  if (/*trace*/ mode == DODGE_RIGHT || mode == DODGE_LEFT) {
    /*trace*/ float rate = mode == DODGE_RIGHT ? DODGE_RATE : -DODGE_RATE;
    /*trace*/ steer(speed, speed * trackCurvature() + rate);
    return;
  }

  /*trace*/ float desiredHeading = laneError() * 0.82f;
  /*trace*/ desiredHeading = desiredHeading > 0.9f ? 0.9f : desiredHeading;
  /*trace*/ desiredHeading = desiredHeading < -0.9f ? -0.9f : desiredHeading;
  /*trace*/ float rate = wheelSpeed() * trackCurvature();
  /*trace*/ rate += 8.0f * (desiredHeading - headingError());
  /*trace*/ rate = rate > 3.3f ? 3.3f : (rate < -3.3f ? -3.3f : rate);
  /*trace*/ steer(speed, rate);
}`,
};

const format = handler=>Object.fromEntries(Object.entries(sketches).map(([kind,source])=>[
  kind, source.split('\n').map((line,index)=>handler(line,index+1)).join('\n'),
]));

export const driveCode = format(line=>line.replace('/*trace*/ ', ''));

export const instrumentedDriveCode = format((line,number)=>{
  const marker=line.indexOf('/*trace*/ ');
  if (marker<0) return line;
  const separator=line[marker-1]==='(' ? ',' : ';';
  return line.replace('/*trace*/ ', `traceLine(${number})${separator} `);
});
