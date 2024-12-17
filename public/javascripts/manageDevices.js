
$(document).ready(function() {
    fetchDevices(); // Call fetchDevices function when page is ready
});

function fetchDevices() {
    // Send the AJAX request
    $.ajax({
        url: '/customers/getDevices',
        method: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("token") }, // Authorization header
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        // Display success message or update the UI
        $('#rxData').html(JSON.stringify(data, null, 2));
        const devices = data.devices;
        const deviceList = document.getElementById('deviceList');
        deviceList.innerHTML = ''; // Clear the list before populating

        devices.forEach(device => {
             // Create list item
            const listItem = document.createElement('li');
            listItem.textContent = `${device.deviceName} (${device.deviceId})`;

            // Append list item to device list
            deviceList.appendChild(listItem);
      });
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        // Handle error
        $('#rxData').html(JSON.stringify(jqXHR, null, 2));
        console.error('Error fetching device:', jqXHR.responseText);
     });
}


function addDevices() {
    // Generate a random API Key
    var API_KEY = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Prepare the data to send
    let txdata = {
        id: $(deviceId).val(),
        name: $(deviceName).val(),
        key: API_KEY
    };

    
    // Send the AJAX request
    $.ajax({
        url: '/customers/addDevice',
        method: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("token") }, // Authorization header
        contentType: 'application/json',
        data: JSON.stringify(txdata),
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        // Display success message or update the UI
        $('#rxData').html(JSON.stringify(data, null, 2));
        console.log('Device added:', data.message); // Log server response message
        fetchDevices();
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        // Handle error
        $('#rxData').html(JSON.stringify(jqXHR, null, 2));
        console.error('Error adding device:', jqXHR.responseText);
     });
}



function removeDevices() {
    let txdata = {
        id: $(deviceId).val()
    };
   
    // Send the AJAX request
    console.log(JSON.stringify(txdata));
    console.log("sending request");
    $.ajax({
        url: '/customers/removeDevice',
        method: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("token") }, // Authorization header
        contentType: 'application/json',
        data: JSON.stringify(txdata),
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        // Display success message or update the UI
        $('#rxData').html(JSON.stringify(data, null, 2));
        console.log('Device removed:', data.message); // Log server response message
        fetchDevices();
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        // Handle error
        $('#rxData').html(JSON.stringify(jqXHR, null, 2));
        console.error('Error removing device:', jqXHR.responseText);
     });
}

$(function () {
    $('#addDeviceButton').click(addDevices);
});

$(function () {
    $('#removeDeviceButton').click(removeDevices);
});


//logout listner, removes token
document.getElementById('logout').addEventListener('click', function () {
    localStorage.removeItem('token');

    window.location.href = 'index.html';
});