var express = require('express');
var router = express.Router();
var Customer = require("../models/customer");
const fs = require('fs');

const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// Handle the webhook data from Particle
router.post("/", function (req, res) {
    const { api_key, event, data, coreid, published_at } = req.body;

    // Log the received webhook data
    console.log('Received webhook data:', { api_key, event, data, coreid, published_at });

    // Step 1: Find customer using apiKey in devices array
    Customer.findOne({ "devices.apiKey": api_key }, function (err, customer) {
        if (err) {
            console.error("Error finding customer:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!customer) {
            return res.status(401).json({ success: false, message: "Invalid API key" });
        }

        // Step 2: Find the specific device in devices array
        const device = customer.devices.find(d => d.apiKey === api_key && d.deviceId === coreid);
        if (!device) {
            console.error("Device not associated with this API key and coreid!");
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        // Step 3: Save the BPM data to bpmReading
        saveDeviceData(customer, data, published_at, function (error, result) {
            if (error) {
                return res.status(400).json(error); // Send error response
            }
            res.status(200).json({ success: true, message: result.message }); // Send success response
        });
    });
});

// Function to save BPM data to bpmReading
function saveDeviceData(customer, bpmData, date, callback) {
    console.log("Saving BPM data...");

    try {
        // Convert data to a number and parse date
        const bpmValue = Number(bpmData);
        const timestamp = new Date(date);

        if (isNaN(bpmValue)) {
            console.error("Invalid BPM value:", bpmData);
            return callback({ success: false, message: "Invalid BPM value" });
        }

        // Step 4: Push the new BPM reading to bpmReading array
        customer.bpmReading.push({
            date: timestamp,
            bpm: bpmValue
        });

        // Step 5: Save updated customer document
        customer.save(function (err) {
            if (err) {
                console.error("Error saving BPM data:", err);
                return callback({ success: false, message: "Failed to save BPM data" });
            }

            console.log("BPM reading saved successfully.");
            callback(null, { success: true, message: "BPM data saved successfully." });
        });
    } catch (err) {
        console.error("Exception saving BPM data:", err);
        return callback({ success: false, message: "Server error while saving BPM data." });
    }
}

module.exports = router;
