var _todoItems = [];
//var statusMessage = ' ';

$.ajaxSetup({ cache: false });
$(function () {
    $('#add-button').on('click', function (event) {
        // retrieve the text
        var newText = $('#task-text').val();

        // blank the text box
        $('#task-text').val('');

        // trim text and ensure its not empty
        if ($.trim(newText) !== '') {
            console.log('About to process text : ' + newText);
            _todoItems.push({task: newText, stamp: moment.utc(new Date()).toDate().getTime()});
            syncDataWithServer();
        }
        $('#task-text').focus();
    });
    $('#clean-local').on('click', function (event) {
        updateStatus("Local Storage Deleted");
        localStorage.removeItem('todos');
        updateUI();
    });
    $(window).bind('online offline', function (e) {
        if (window.navigator.onLine) {
            // FIXME we might have to repopulate in memory data from local storage, in some scenarios?
            updateStatus("Network Status : Online");
            // an immediate call seems to stump Chrome and result in a ERR_NETWORK_CHANGED error
            setTimeout(syncDataWithServer, 1000);
        } else {
            updateStatus("Network Status : Offline (data will be cached locally)");
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
        console.log('GET always/finally block, status?', textStatus);
        if (textStatus === 'error') {
            updateStatus("Data Source : Cache");
            _todoItems = getStorageValue();
        } else {
            updateStatus("Data Source : Server");
        }
        updateUI();
    });
}

function syncDataWithServer() {
    var dataAsString = JSON.stringify({items: _todoItems});
    console.log("Sending data to server", dataAsString);
    $.ajax({
        url: "api/todos/save",
        type: "GET",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (msg) {
            console.log("Save to server response?", msg);
            getDataFromServer();
        },
        data: "data=" + Base64.encode(dataAsString)
    }).always(function (jqXHR, textStatus) {
        console.log('Save always/finally block, status?', textStatus);
        if (textStatus === 'error') {
            updateStatus("You can work offline & reload page as well. \n Data will be saved to server automatically once online.");
            //$('#save-to-server').prop('disabled', false);
        } else {
            console.log("Saved to server successfully!");
            // no good loggin to the UI here, it will be overwritten
            //$('#save-to-server').prop('disabled', true);
        }
        // always save to local cache
        // both of these calls will be duplicated for a succesful online call, by the subsequent get/refresh
        saveLocally(_todoItems); 
        updateUI();
    });
}

function saveLocally(itemList) {
    console.log("Saving to local storage...");
    localStorage.setItem("todos", JSON.stringify({items: itemList}));
}

function updateUI() {
    updateTodo();
    //updateStatus(statusMessage);
    $('#clean-local').prop('disabled', isStorageEmpty());
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

function updateStatus(message) {
    $('#status').text("Status: " + message);
}

function updateTodo() {
    // if we are offline, we can't rely on server side sorting of the array!
    _todoItems.sort(function(a, b) {
        return parseFloat(b.stamp) - parseFloat(a.stamp);
    });

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