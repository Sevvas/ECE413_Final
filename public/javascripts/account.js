// public/javasciprts/account.js
$(function (){
    $('#btnLogOut').click(logout);

    $.ajax({
        url: '/customers/status',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("token") },
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        $('#rxData').html(JSON.stringify(data, null, 2));
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        window.location.replace("display.html");
    });
});

function logout() {
    localStorage.removeItem("token");
    window.location.replace("index.html");
}

function changePassword(){
    window.location.replace("changePassword.html");
}

function newPassword(){
    if($('#newPassword').val() != $('#newPasswordConfirm').val()){
        window.alert("New password and confirmation new password don't match.");
        return;
      }
    
    let txdata = {
        email: $('#email').val(),
        password: $('#newPassword').val()
    };
    $.ajax({
        url: '/customers/changePassword',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(txdata),
        dataType: 'json'
    })
    .done(function (data, textStatus, jqXHR) {
        $('#rxData').html(JSON.stringify(data, null, 2));
        if (data.success) {
            // after 1 second, move to "login.html"
            setTimeout(function(){
                window.location = "login.html";
            }, 1000);
        }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        if (jqXHR.status == 404) {
            $('#rxData').html("Server could not be reached!!!");    
        }
        else $('#rxData').html(JSON.stringify(jqXHR, null, 2));
    });
}

function manageDevices(){
    window.location.replace("manageDevices.html");
}

$(function () {
    $('#btnChangePassword').click(changePassword);
});

$(function () {
    $('#btnNewPassword').click(newPassword);
});

$(function () {
    $('#btnManageDevices').click(manageDevices);
});


//logout listner, removes token
document.getElementById('logout').addEventListener('click', function () {
    localStorage.removeItem('token');

    window.location.href = 'index.html';
});