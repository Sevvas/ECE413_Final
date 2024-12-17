//SYSTEM_THREAD(ENABLED);
SYSTEM_MODE(SEMI_AUTOMATIC);

#include <Wire.h>
#include "MAX30105.h"
#include <vector>

#define BLUE 0x0000FF
#define GREEN 0x00FF00
#define YELLOW 0xFFFF00

struct Measurement {
    float bpm;
    unsigned long timestamp; // Store time to track data expiration
};

std::vector<Measurement> offlineData; // Vector to store measurements locally
//unsigned long lastMeasurementTime = 0; // Time of the last measurement
unsigned long lastMeasurementTime = 60 * 1000; // Time of the last measurement
//const unsigned long measurementInterval = 30 * 60 * 1000; // Default: 30 minutes
const unsigned long measurementInterval = 30 * 1000;
const unsigned long measurementTimeout = 5 * 60 * 1000;   // 5-minute timeout
unsigned long requestStartTime = 0;

enum State {IDLE, REQUEST_MEASUREMENT, PROCESS_MEASUREMENT, SEND_DATA, STORE_DATA};
State currentState = IDLE;
MAX30105 particleSensor;

float beatsPerMinute = 0.0;
int hourStart = 6;
int hourEnd = 24;
int timeFrequency = 30;

void handle(const char *event, const char *data) {
  // Add functionality here
}

int led = D7; // The on-board LED

void setup() {
  Serial.begin(9600);
  Serial.println("Initializing...");
  
  // Non-blocking Wi-Fi connection with timeout
    WiFi.on();
    unsigned long wifiStartTime = millis();
    WiFi.connect();

    while (!WiFi.ready() && (millis() - wifiStartTime) < 10000) { // 10-second timeout
        delay(100);
    }

    if (WiFi.ready()) {
        Serial.println("Wi-Fi connected.");
        Particle.connect();
    } else {
        Serial.println("Wi-Fi connection failed. Operating offline.");
    }

    // Non-blocking Particle Cloud connection
    unsigned long particleStartTime = millis();
    while (!Particle.connected() && (millis() - particleStartTime) < 5000) { // 5-second timeout
        Particle.process(); // Allow background tasks
    }

    if (Particle.connected()) {
        Serial.println("Particle Cloud connected.");
    } else {
        Serial.println("Particle Cloud connection failed. Operating offline.");
    }

  Particle.syncTime();
  Time.zone(-7); //Arizona Time
  // Subscriptions to Particle Webhooks
  Particle.subscribe("hook-response/testData", handle, MY_DEVICES);

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) { // Use default I2C port, 400kHz speed
    Serial.println("MAX30105 was not found. Please check wiring/power.");
    while (1){
    };
  }

  particleSensor.setup(); // Configure sensor with default settings
  RGB.control(TRUE);
}

void loop(){
  
  if (!WiFi.ready()) {
        WiFi.connect();
        Serial.println("Wi-Fi connected.");
        unsigned long wifiTimeout = millis();
        while (!WiFi.ready() && (millis() - wifiTimeout) < 5000) {
            delay(100);
        }
    }

    if (!Particle.connected()) {
        Particle.connect();
        Serial.println("Particle Cloud connected.");
        unsigned long particleTimeout = millis();
        while (!Particle.connected() && (millis() - particleTimeout) < 5000) {
            Particle.process();
        }
    }

  switch (currentState) {
        case IDLE:
            IdleState();
            break;
        case REQUEST_MEASUREMENT:
            RequestMeasurement();
            break;
        case PROCESS_MEASUREMENT:
            ProcessMeasurement();
            break;
        case SEND_DATA:
            SendData();
            break;
        case STORE_DATA:
            StoreData();
            break;
    }
}

bool checkTime() {
    int currentHour = Time.hour(); // Get the current hour (24-hour format)
    return (currentHour >= hourStart && currentHour < hourEnd); // Between 6 AM and 10 PM
}

void IdleState() {
   // Wait until it's time for the next measurement
  if ((millis() - lastMeasurementTime >= measurementInterval) && checkTime()) {
      Serial.println("Time for new measurement.");
      currentState = REQUEST_MEASUREMENT;
      requestStartTime = millis(); // Start request timer
  }
}

void RequestMeasurement() {
    Serial.println("Requesting measurement... Flashing blue LED.");
    flashLED(BLUE, 100);

    long irValue = particleSensor.getIR();
    delay(2000);
    // Check for valid measurement or timeout
    if (irValue > 10000) { // Threshold for valid input
        beatsPerMinute = (irValue / 1831.0) + 30;
        if (beatsPerMinute > 40 && beatsPerMinute < 200) { // Validate BPM
            Serial.print("Valid BPM: ");
            Serial.println(beatsPerMinute);
            currentState = PROCESS_MEASUREMENT;
        }
    } else if (millis() - requestStartTime >= measurementTimeout) {
        Serial.println("Measurement timeout. Returning to IDLE.");
        currentState = IDLE;
    }
}

void ProcessMeasurement() {
  if(Particle.connected()){
    currentState = SEND_DATA;
  }
  else {
    currentState = STORE_DATA;
  }
}

void SendData() {
    Serial.println("Sending data to server...");

    if (Particle.publish("testData", String(beatsPerMinute), PRIVATE)) {
        Serial.println("Data sent successfully... Flashing green LED.");
        flashLED(GREEN, 1000);
        flashLED(GREEN, 1000);
        flashLED(GREEN, 1000);
        //delay(1000);
    } else {
        Serial.println("Failed to send data. Storing locally.");
        currentState = STORE_DATA;
    }

    lastMeasurementTime = millis(); // Update last measurement time
    currentState = IDLE; // Return to idle state
}

void StoreData() {
    Measurement data = { beatsPerMinute, millis() };
    offlineData.push_back(data);
    Serial.println("Data stored locally (offline)... Flashing yellow LED");
    flashLED(YELLOW, 1000);
    flashLED(YELLOW, 1000);
    flashLED(YELLOW, 1000);

    // Remove offline data older than 24 hours
    unsigned long currentTime = millis();
    offlineData.erase(
        std::remove_if(offlineData.begin(), offlineData.end(),
                       [currentTime](const Measurement &data) {
                           return (currentTime - data.timestamp) > 86400000;
                       }),
        offlineData.end());

    lastMeasurementTime = millis();
    currentState = IDLE;
}

void flashLED(uint32_t color, int duration) {
    RGB.color(color);
    delay(duration);
    RGB.color(0, 0, 0); // Turn off LED
    delay(100);
}


/*  digitalWrite(led, HIGH); //Turn ON the LED

  long irValue = particleSensor.getIR();
  delay(2000);

  if(irValue > 10000){
    beatsPerMinute = (irValue/1831.0) + 30;
    if ((beatsPerMinute > 40) && (beatsPerMinute < 200)) {
    Particle.publish("heart_rate", String(beatsPerMinute), PRIVATE);
    }*/