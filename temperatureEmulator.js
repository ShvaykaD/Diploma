/**
 * Created by mshvayka on 14.05.18.
 */
var mqtt = require('mqtt');
const ACCESS_TOKEN = "ME0oSWC98eCl6ISGlnkX";

// Initialization of mqtt client using device access token
var client  = mqtt.connect('mqtt://localhost',{
    username: ACCESS_TOKEN
});

// Initialization of mqtt client using device access token
var clientAeration = mqtt.connect('mqtt://127.0.0.1', {
    username: 'AERATION_TOKEN'
});

var value = 17;

var aerationFlag = {method: "turnOn"};
var msgFlag;

clientAeration.on('connect', function () {
    console.log('connected');
    clientAeration.subscribe('v1/devices/me/rpc/request/+');
});

clientAeration.on('message', function (topic, message) {
    console.log('request.topic: ' + topic);
    console.log('request.body: ' + message.toString());
    var tmp =  JSON.parse(message.toString())
    if((msgFlag === undefined || !msgFlag) && tmp.method == "turnOn") {
        aerationFlag = tmp;
        msgFlag = true;
        console.log('Turning ON...');
        clientAeration.publish('v1/devices/me/telemetry', JSON.stringify({aerationFlag: "ON" }));
    }

    if((msgFlag === undefined || msgFlag) && tmp.method == "turnOff"){
        aerationFlag = tmp;
        msgFlag = false;
        console.log('Turning OF...');
        clientAeration.publish('v1/devices/me/telemetry', JSON.stringify({aerationFlag: "OFF" }));
    }
    var requestId = topic.slice('v1/devices/me/rpc/request/'.length);
    //client acts as an echo service
     clientAeration.publish('v1/devices/me/rpc/response/' + requestId, message);
});



client.on('connect', function () {
    console.log('Client connected');
    client.subscribe('v1/devices/me/rpc/request/+');
    console.log('Uploading temperature data once per second...');
    setInterval(publishTelemetryThermostat, 5000);
});


function emulateTemperatureChangingThermostat() {
    console.log('aerationFlag - : ' + aerationFlag.method);
   // console.log(aerationFlag);
    if(aerationFlag.method == "turnOff") {
        value += Math.random();
        //console.log('value + : ' + JSON.stringify({temperature: value}));
    } else if (aerationFlag.method == "turnOn"){
        value -= Math.random();
        //console.log('value - : ' + JSON.stringify({temperature: value}));
    }
    return value = Math.round(value * 10) / 10;

}

function publishTelemetryThermostat() {
    emulateTemperatureChangingThermostat();
    console.log('Sending: ' + JSON.stringify({temperature: value}));
    client.publish('v1/devices/me/telemetry', JSON.stringify({temperature: value}));
}

//Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    clientAeration.end();
    console.log('Exited!');
    process.exit(2);
});

//Catches uncaught exceptions
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});


