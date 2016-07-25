var _todoItems = [];
var statusMessage = ' ';
$.ajaxSetup({ cache: false });
$(function () {
    $('#add-button').on('click', function (event) {
        var newText = $('#task-text').val();
        $('#task-text').val('');
        if ($.trim(newText) !== '') {
            console.log('Add item : ' + $('#task-text').val());
            statusMessage = "Added: " + newText;
            _todoItems.push({task: newText, stamp: moment.utc(new Date()).toDate().getTime()});
            syncDataWithServer();
        }
        $('#task-text').focus();
    });
    $('#clean-local').on('click', function (event) {
        statusMessage = 'Local Storage Deleted.';
        localStorage.removeItem('todos');
        updateUI();
    });
    $(window).bind('online offline', function (e) {
        if (window.navigator.onLine) {
            syncDataWithServer();
            updateStatus("Network is back/online.");
        } else {
            updateStatus("Network went offline, data will be saved to cache.");
        }
    });
    getDataFromServer();
});

function getDataFromServer() {
    $.ajax({
        url: 'api/todos/get',
        method: 'GET',
        success: function (data, status, message) {
            _todoItems = data.items;
            saveLocally(_todoItems);
        }
    }).always(function (jqXHR, textStatus) {
        console.log('get always/finally block, status ', textStatus);
        if (textStatus === 'error') {
            statusMessage = 'Getting Cached Data as sever seems down';
            _todoItems = getStorageValue();
        } else {
            statusMessage = "Data loaded from server";
        }
        updateUI();
    });
}

function isStorageEmpty() {
    return getStorageValue().length == 0;
}

function getStorageValue() {
    var result = [];
    if (localStorage.getItem('todos') !== null) {
        result = JSON.parse(localStorage.getItem('todos')).items || [];
    }
    return result;
}

function syncDataWithServer() {
    var dataAsString = JSON.stringify({items: _todoItems});
    console.log("Sending to Server..", dataAsString);
    $.ajax({
        url: "api/todos/save",
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (msg) {
            statusMessage = "Save to server: " + msg;
            getDataFromServer();
        },
        data: "data=" + Base64.encode(dataAsString)
    }).always(function (jqXHR, textStatus) {
        console.log('Save always/finally block, status ', textStatus);
        if (textStatus === 'error') {
            statusMessage = "You can work offline & reload page as well. \n Data will be saved to server automatically once online.";
            $('#save-to-server').prop('disabled', false);
        } else {
            statusMessage = "Saved to server";
            $('#save-to-server').prop('disabled', true);
        }
        saveLocally(_todoItems);//Always save to local cache
        updateUI();
    });
}

function saveLocally(itemList) {
    console.log("Saving locally..");
    localStorage.setItem("todos", JSON.stringify({items: itemList}));
}

function updateUI() {
    updateTodo();
    updateStatus(statusMessage);
    $('#clean-local').prop('disabled', isStorageEmpty());
}

function updateStatus(message) {
    $('#status').text("Status: " + message);
}

function updateTodo() {
    var todoList = $('#todo-list');
    var ul = $('<ul>');
    todoList.empty();
    _todoItems.forEach(function (t) {
        var li = $('<li>');
        li.text(t.task + " (" + moment(t.stamp).format("dddd, MMMM Do YYYY, h:mm:ss a") + ")");
        ul.append(li);
    });
    todoList.append(ul);
}