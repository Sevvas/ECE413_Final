function viewData(){
    // Send the AJAX request
    console.log("sending request for data");

    $.ajax({
        url: '/customers/getuserData',
        method: 'GET',
        headers: { 'x-auth': window.localStorage.getItem("token") }, // Authorization header
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        // Display success message or update the UI
        $('#rxData').html(JSON.stringify(data.bpmReading, null, 2));
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        // Handle error
        $('#rxData').html(JSON.stringify(jqXHR, null, 2));
        console.error('Error fetching data:', jqXHR.responseText);
     });
}

$(function () {
    $('#btnViewData').click(viewData);
});


//logout listner, removes token
document.getElementById('logout').addEventListener('click', function () {
    localStorage.removeItem('token');

    window.location.href = 'index.html';
});