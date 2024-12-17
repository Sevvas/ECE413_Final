// public/javasciprts/signup.js

function signup() {
    // data validation
    if ($('#email').val() === "") {
        window.alert("invalid email!");
        return;
    }
    let regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    emailValid = regex.test($('#email').val());
    if(!emailValid){
        window.alert("invalid email!");
        return;
    }
    if ($('#password').val() === "") {
        window.alert("invalid password");
        return;
    }
    else if($('#password').val().length < 8 | $('#password').val().length > 20){
        window.alert('Password must be between 8 and 20 characters.');
        return;
    }
    else if (!/[a-z]/.test($('#password').val())){
        errors.push('Password must contain at least one lowercase character.');
        return;
    }
    else if (!/[A-Z]/.test($('#password').val())) {
        window.alert('Password must contain at least one uppercase character.');
        return;
    }
    else if (!/\d/.test($('#password').val())) {
        window.alert('Password must contain at least one digit.');
        return;
    }
    else if($('#password').val() != $('#confirmPassword').val()){
        window.alert("Password and confirmation password don't match.");
        return;
      }
    let txdata = {
        email: $('#email').val(),
        password: $('#password').val()
    };
    $.ajax({
        url: '/customers/signUp',
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

$(function () {
    $('#btnSignUp').click(signup);
});

