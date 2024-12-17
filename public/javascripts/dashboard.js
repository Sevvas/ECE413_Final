//var express = require('express');
//var router = express.Router();
//var Customer = require("../models/customer");

// CRUD implementation
//logout listner, removes token
/*document.getElementById('logout').addEventListener('click', function () {
    localStorage.removeItem('token');

    window.location.href = 'index.html';
});*/

function logout(){
    localStorage.removeItem('token');

    window.location.href = 'index.html';
}

$(function () {
    $('#logout').click(logout);
});

document.addEventListener('DOMContentLoaded', function () {

    const dayButton = document.querySelector('.btn[data-action="day"]');
    const weekButton = document.querySelector('.btn[data-action="week"]');

    if (dayButton) {
        dayButton.addEventListener('click', fetchUserDataDay);
    }

    if (weekButton) {
        weekButton.addEventListener('click', fetchUserDataWeekly);
    }
});
//Single Day fetch

function fetchUserDataDay() {
    $.ajax({
        url: '/customers/getuserData',
        method: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json'
    })
    .done(function (data) {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
 
        // Verify bpmReading exists
        if (!data.bpmReading || !Array.isArray(data.bpmReading)) {
            console.error('Invalid data format: bpmReading missing or incorrect.');
            return;
        }
 
        // Filter readings for today's date
        const dayReadings = data.bpmReading.filter(reading => {
            const readingDate = new Date(reading.date).toISOString().split('T')[0];
            return readingDate === today;
        });
 
        // Calculate min, max, and average BPM
        const avgBPM = Math.round((dayReadings.reduce((sum, r) => sum + r.bpm, 0)) / dayReadings.length) || 0;
        const minBPM = Math.round(Math.min(...dayReadings.map(r => r.bpm))) || 0;
        const maxBPM = Math.round(Math.max(...dayReadings.map(r => r.bpm))) || 0;
 
        // Log results
        console.log('Today\'s BPM Readings:', dayReadings);
        console.log(`Min: ${minBPM}, Max: ${maxBPM}, Avg: ${avgBPM}`);
 
        // Update UI
        updateTable('day', minBPM, maxBPM, avgBPM);
        updateDoughnutChart(dayReadings);
        updateBarLineChart(dayReadings);
    })
    .fail(function (error) {
        console.error('Error fetching user data for today:', error);
    });
 }

//Weekly fetch
function fetchUserDataWeekly() {
    $.ajax({
        url: '/customers/getuserData',
        method: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json'
    })
    .done(function (data) {
        const today = new Date(); // Current date
        const priorWeek = new Date(today);
        priorWeek.setDate(today.getDate() - 7); // Subtract 7 days for the weekly range
 
        // Verify bpmReading exists
        if (!data.bpmReading || !Array.isArray(data.bpmReading)) {
            console.error('Invalid data format: bpmReading missing or incorrect.');
            return;
        }
 
        // Filter readings within the last 7 days
        const weeklyReadings = data.bpmReading.filter(reading => {
            const readingDate = new Date(reading.date);
            return readingDate >= priorWeek && readingDate <= today;
        });
 
        // Calculate min, max, and average BPM
        const avgBPM = Math.round((weeklyReadings.reduce((sum, r) => sum + r.bpm, 0)) / weeklyReadings.length) || 0;
        const minBPM = Math.round(Math.min(...weeklyReadings.map(r => r.bpm))) || 0;
        const maxBPM = Math.round(Math.max(...weeklyReadings.map(r => r.bpm))) || 0;
 
        // Log results
        console.log('Weekly BPM Readings:', weeklyReadings);
        console.log(`Min: ${minBPM}, Max: ${maxBPM}, Avg: ${avgBPM}`);
 
        // Update UI
        updateTable('week', minBPM, maxBPM, avgBPM);
        updateDoughnutChart(weeklyReadings);
        updateBarLineChart(weeklyReadings);
    })
    .fail(function (error) {
        console.error('Error fetching weekly user data:', error);
    });
 }


//Table graph
function updateTable(option, min, max, avg) {
    const table = document.getElementById('county_table'); //rename example table?
    const tableRow = table.rows[1];
    if (option === 'day' || option ==='week'){
        tableRow.cells[0].innerHTML = min;
        tableRow.cells[1].innerHTML = max;
        tableRow.cells[2].innerHTML = avg;
    }
}



//Bar graph

function updateBarLineChart(readings) {
    const bpmValues = readings.map(r => r.bpm);
    const labels = readings.map(r => new Date(r.date).toLocaleDateString());
    

    const data = {
        labels: labels,
        datasets: [{
            type: 'bar',
            label: 'BPM',
            data: bpmValues,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 0, 0, 0.2)'
        }]
    };
    const config = {
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins:{
                title: {
                    display:true,
                    text:'Bar Chart BPM'
                }                
            }
        }
    };


    if (gCharts.barLine == null) {
        ctx = document.getElementById('barLineChart');
        gCharts.barLine = new Chart(ctx, config);
    }else{
        gCharts.barLine.data = data; 
        gCharts.barLine.update();    
    }



}






//Doughnut graph update
function updateDoughnutChart(readings) {
    const bpmValues = readings.map(r => r.bpm);
    const labels = readings.map((r, index)=> `Reading ${index + 1}`);
    const bgColor = [];


    const data = {
        labels: labels,
        datasets: [{
            label: 'BPM',
            data: bpmValues,
            backgroundColor: bgColor,
            hoverOffset: 4
        }]
    };


    const config = {
        type: 'doughnut',
        data: data,
        options: {
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Doughnut Chart BPM'
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    };


    if (gCharts.doughnut == null) {
        ctx = document.getElementById('doughnutChart');
        gCharts.doughnut = new Chart(ctx, config);
    }else{
        //update chart and rerender
        gCharts.doughnut.data = data; 
        gCharts.doughnut.update();
    }


}





