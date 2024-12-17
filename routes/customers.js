var express = require('express');
var router = express.Router();
var Customer = require("../models/customer");
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const fs = require('fs');

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
// For encoding/decoding JWT

const secret = fs.readFileSync(__dirname + '/../keys/jwtkey').toString();

// example of authentication
// register a new customer

// please fiil in the blanks
// see javascript/signup.js for ajax call
// see Figure 9.3.5: Node.js project uses token-based authentication and password hashing with bcryptjs on zybooks

router.post("/signUp", function (req, res) {
   Customer.findOne({ email: req.body.email }, function (err, customer) {
       if (err) res.status(401).json({ success: false, err: err });
       else if (customer) {
           res.status(401).json({ success: false, msg: "This email already used" });
       }
       else {
           const passwordHash = bcrypt.hashSync(req.body.password, 10);
           const newCustomer = new Customer({
               email: req.body.email,
               passwordHash: passwordHash
           });

           newCustomer.save(function (err, customer) {
               if (err) {
                   res.status(400).json({ success: false, err: err });
               }
               else {
                   let msgStr = `Customer (${req.body.email}) account has been created.`;
                   res.status(201).json({ success: true, message: msgStr });
                   console.log(msgStr);
               }
           });
       }
   });
});

// please fill in the blanks
// see javascript/login.js for ajax call
// see Figure 9.3.5: Node.js project uses token-based authentication and password hashing with bcryptjs on zybooks

router.post("/logIn", function (req, res) {
   if (!req.body.email || !req.body.password) {
       res.status(401).json({ error: "Missing email and/or password" });
       return;
   }
   // Get user from the database
   Customer.findOne({ email: req.body.email }, function (err, customer) {
       if (err) {
           res.status(400).send(err);
       }
       else if (!customer) {
           // Username not in the database
           res.status(401).json({ error: "Login failure!!" });
       }
       else {
           if (bcrypt.compareSync(req.body.password, customer.passwordHash)) {
               const token = jwt.encode({ email: customer.email }, secret);
               //update user's last access time
               customer.lastAccess = new Date();
               customer.save((err, customer) => {
                   console.log("User's LastAccess has been update.");
               });
               // Send back a token that contains the user's username
               res.status(201).json({ success: true, token: token, msg: "Login success" });
           }
           else {
               res.status(401).json({ success: false, msg: "Email or password invalid." });
           }
       }
   });
});

// please fiil in the blanks
// see javascript/account.js for ajax call
// see Figure 9.3.5: Node.js project uses token-based authentication and password hashing with bcryptjs on zybooks

router.get("/status", function (req, res) {
   // See if the X-Auth header is set
   if (!req.headers["x-auth"]) {
       return res.status(401).json({ success: false, msg: "Missing X-Auth header" });
   }
   // X-Auth should contain the token 
   const token = req.headers["x-auth"];
   try {
       const decoded = jwt.decode(token, secret);
       // Send back email and last access
       Customer.find({ email: decoded.email }, "email lastAccess", function (err, users) {
           if (err) {
               res.status(400).json({ success: false, message: "Error contacting DB. Please contact support." });
           }
           else {
               res.status(200).json(users);
           }
       });
   }
   catch (ex) {
       res.status(401).json({ success: false, message: "Invalid JWT" });
   }
});

router.post("/changePassword", function (req, res) {
    Customer.findOne({ email: req.body.email }, function (err, customer) {
        if (err) {
            return res.status(400).send(err);
        }
        if (!customer) {
            // Username not in the database
            return res.status(401).json({ error: "User does not exist" });
        }

        // Hash the new password
        let passwordHash;
        passwordHash = bcrypt.hashSync(req.body.password, 10);
       

        // Update the customer's passwordHash
        customer.passwordHash = passwordHash;

        // Save the updated customer object
        customer.save(function (err, updatedCustomer) {
            if (err) {
                return res.status(400).json({ success: false, err: err });
            }
            let msgStr = `Customer (${req.body.email}) password has been changed.`;
            res.status(201).json({ success: true, message: msgStr });
            console.log(msgStr);
        });
    });
});

router.get("/getDevices", function (req, res) {
    // Validate and decode JWT from the header
    const authHeader = req.headers["x-auth"];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Authentication token is missing." });
    }
    // if x-auth exists, get email from token.
     if (req.headers["x-auth"]) {
     try {
         email = jwt.decode(req.headers["x-auth"], secret).email;
     } catch (exception) {
         responseJson.message = "Invalid authorization token.";
         return res.status(400).json(responseJson);
     }
 }
    Customer.findOne({ email }, function(err, customer){
    if (err) {
        res.status(400).send(err);
    }
    else if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    else{
        res.json({ success: true, devices: customer.devices });
       }
    });
});

router.post("/addDevice", function (req, res) {
    // Validate request body
    const { id, name, key } = req.body;
    if (!id || !name || !key) {
        return res.status(400).json({ success: false, message: "Missing required fields: id, name, or key." });
    }

    // Validate and decode JWT from the header
    const authHeader = req.headers["x-auth"];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Authentication token is missing." });
    }

    let email;
    try {
        email = jwt.decode(authHeader, secret).email;
    } catch (exception) {
        console.error("JWT decode error:", exception.message);
        return res.status(400).json({ success: false, message: "Invalid authorization token." });
    }

    // Find the customer
    Customer.findOne({ email }, function (err, customer) {
        if (err) {
            console.error("Error finding customer:", err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }

        // Check for duplicate device ID or Name
        const duplicate = customer.devices.some(
            device => device.deviceId === id || device.deviceName === name
        );

        if (duplicate) {
            return res.status(409).json({ success: false, message: "Device ID or Name already exists." });
        }

        // Add the device to the customer's devices array
        customer.devices.push({ deviceId: id, deviceName: name, apiKey: key });

        // Save the updated customer and handle success/error
        customer.save(function (saveErr) {
            if (saveErr) {
                console.error("Error saving customer:", saveErr);
                return res.status(500).json({ success: false, message: "Failed to add device." });
            }
            // Respond with success
            const msgStr = `Device (${name}) has been added.`;
            res.status(201).json({ success: true, message: msgStr });
            console.log(msgStr);
        });
    });
});

router.post("/removeDevice", function (req, res) {
    console.log("In /removeDevice route");

    const { id } = req.body; // Device ID to remove
    console.log("Device ID to remove:", id);

    if (!id) {
        return res.status(400).json({ success: false, message: "Device ID is required." });
    }

    // Validate and decode JWT from the header
    const authHeader = req.headers["x-auth"];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Authentication token is missing." });
    }

    let email;
    try {
        email = jwt.decode(authHeader, secret).email;
        if (!email) {
            throw new Error("Invalid token payload.");
        }
    } catch (exception) {
        console.log("JWT Decode Error:", exception.message);
        return res.status(400).json({ success: false, message: "Invalid authorization token." });
    }

    // Find the customer
    Customer.findOne({ email }, function (err, customer) {
        if (err) {
            console.error("Error finding customer:", err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        } else if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }

        console.log("Customer found:", customer.email);
        console.log("Devices before removal:", customer.devices);

        // Find and remove the device
        const index = customer.devices.findIndex(device => device.deviceId === id);

        if (index === -1) {
            console.log("Device not found in customer's devices array.");
            return res.status(404).json({ success: false, message: "Device not found." });
        }

        console.log("Device found, removing...");
        customer.devices.splice(index, 1);

        // Save the updated customer document
        customer.save(function (saveErr) {
            if (saveErr) {
                console.error("Error saving updated customer:", saveErr);
                return res.status(500).json({ success: false, message: "Failed to remove device." });
            }
            console.log("Device removed successfully.");
            res.status(200).json({ success: true, message: `Device ${id} removed successfully.` });
        });
    });
});

//get sensor data

router.get("/getuserData", function (req, res) {
    console.log("in data router");
    if (!req.headers["x-auth"]) {
        return res.status(401).json({ success: false, msg: "Missing X-Auth header" });
    }

    try {
        // Verify and decode the token
        //const decoded = jwt.verify(token, secret);
        //const email = decoded.email; // Extract email from token payload
        email = jwt.decode(req.headers["x-auth"], secret).email;

        // Find customer by email
        Customer.findOne({ email: email }, "bpmReading", function (err, customer) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ success: false, message: "Database error in get" });
            }

            if (!customer) {
                return res.status(404).json({ success: false, msg: "Customer not found" });
            }

            // Check if bpmReading exists and has data
            if (!customer.bpmReading || customer.bpmReading.length === 0) {
                return res.status(404).json({ success: false, msg: "No Data Found" });
            }

            res.status(200).json({ success: true, bpmReading: customer.bpmReading });
        });
    } catch (ex) {
        console.error("JWT error:", ex);
        res.status(401).json({ success: false, message: "Invalid JWT" });
    }
});



module.exports = router;