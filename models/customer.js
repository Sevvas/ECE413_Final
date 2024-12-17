const db = require("../db");

const customerSchema = new db.Schema({
    email:      String,
    passwordHash:   String,
    lastAccess:     { type: Date, default: Date.now },
    devices: [{deviceId: String, deviceName: String, apiKey: String}],
    bpmReading: [{date: Date, bpm: Number}]
});

 const Customer = db.model("Customer", customerSchema);

module.exports = Customer;