var express = require('express');
var bodyParser = require('body-parser');
var Base64 = require('js-base64').Base64;
var _ = require('lodash');
var app = new express();

// process.env.PORT lets the port be set by Heroku
var httpPort = process.env.PORT || 19082;

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }));
// parse various different custom JSON types as JSON
app.use(bodyParser.json());
// parse an HTML body into a string
app.use(bodyParser.text({type: 'text/html'}));
app.use(express.static(__dirname + '/web'));

var todoItems = [];

app.get('/ping', function (request, response) {
    console.log('ping....');
    response.json({online: true});
});

app.get('/api/todos/save', function (request, response) {
    var decodedData = Base64.decode(request.query.data);
    console.info("saving " + decodedData);
    var jsonData = JSON.parse(decodedData);
    todoItems = mergeAndSortOnTimeStamp(todoItems, jsonData.items  ? jsonData.items : []);
    response.json('saved');
});

app.get('/api/todos/delete', function (request, response) {
    todoItems = [];
    response.json('all todo is deleted');
});

app.get('/api/todos/get', function (request, response) {
    //response.json({items: todoItems});
    response.json({items: todoItems.reverse()});
});

app.listen(httpPort, function () {
    console.log("Listening on " + httpPort);
});

function mergeAndSortOnTimeStamp(serverItems, requestItems) {
    var merged = _.uniqBy(_.concat(serverItems, requestItems), 'stamp');
    return _.sortBy(merged,'stamp');
}