/**
 * Created by mshvayka on 14.05.18.
 */
var mqtt = require('mqtt');
const ACCESS_TOKEN = "ME0oSWC98eCl6ISGlnkX";

var client  = mqtt.connect('mqtt://localhost',{
    username: ACCESS_TOKEN
});

var controlValue,
    realValue = 18;

client.on('connect', function () {
    console.log('Client connected');
    client.subscribe('v1/devices/me/rpc/request/+');
    console.log('Uploading temperature data once per second...');
    setInterval(publishTelemetry, 1000);
});

client.on('message', function (topic, message) {
    console.log('request.topic: ' + topic);
    console.log('request.body: ' + message.toString());
    var requestId = topic.slice('v1/devices/me/rpc/request/'.length),
        messageData = JSON.parse(message.toString());
    if (messageData.method === 'getValue') {
        if(controlValue === undefined) {
            client.publish('v1/devices/me/rpc/response/' + requestId, JSON.stringify(realValue));
        } else {
            client.publish('v1/devices/me/rpc/response/' + requestId, JSON.stringify(controlValue));
        }
    } else if (messageData.method === 'setValue') {
        controlValue = messageData.params;
        console.log('Going to set new control value: ' + controlValue);
    } else {
        client.publish('v1/devices/me/rpc/response/' + requestId, message);
    }
});

function publishTelemetry() {
    emulateTemperatureChanging();
    client.publish('v1/devices/me/telemetry', JSON.stringify({temperature: realValue}));
}

function emulateTemperatureChanging() {
    if(controlValue !== undefined) {
        if(controlValue >= realValue) {
            realValue += (Math.random() + (Math.abs(controlValue - realValue)/30));
        } else {
            realValue -= (Math.random() + (Math.abs(controlValue - realValue)/30));
        }
    }
}

//Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    console.log('Exited!');
    process.exit(2);
});

//Catches uncaught exceptions
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});