/**
 * Created by mshvayka on 14.05.18.
 */
var mqtt = require('mqtt');
const ACCESS_TOKEN = "qW24hpkMi3HIRwwgasVo";
//const a = 12.28039 , b = -0.128973 , c = -0.473026;
//const a = 13.12305 , b = -0.174 , c = -0.452103;
//const a = 13.96125 , b = -0.148378 , c = -0.604968;
const  minHumidity = 12, maxHumidity = 17;
//const  minHumidity = 12, maxHumidity = 22;


var client  = mqtt.connect('mqtt://localhost',{
    username: ACCESS_TOKEN
});

var controlValueTemperature,
    realValueTemperature = 25;

var data = {
    humidity: minHumidity + (maxHumidity - minHumidity) * Math.random()
};

var rl = require('readline');
var  a,b,c;

var prompts = rl.createInterface(process.stdin, process.stdout);




client.on('connect', function () {
    prompts.question("What type of grain you want to explore?",
        function(typeOfGrain){

            var msg = "";

            if( typeOfGrain == 'Wheat' ) {
                a = 12.28039 , b = -0.128973 , c = -0.473026;
                msg = "Data is calculated for the type of grain: Wheat";
            }
            else if( typeOfGrain == 'Oat' )  {
                a = 13.12305 , b = -0.174 , c = -0.452103;
                msg = "Data is calculated for the type of grain: Oat";
            }else if( typeOfGrain == 'Rye' )  {
                a = 13.96125 , b = -0.148378 , c = -0.604968;
                msg = "Data is calculated for the type of grain: Rye";
            }


            console.log(msg);
            console.log('connected');
            client.subscribe('v1/devices/me/rpc/request/+');
            console.log('Uploading temperature and humidity data once per second...');
            setInterval(publishTelemetry, 1000);
        });
});

client.on('message', function (topic, message) {
    console.log('request.topic: ' + topic);
    console.log('request.body: ' + message.toString());
    var requestId = topic.slice('v1/devices/me/rpc/request/'.length),
        messageData = JSON.parse(message.toString());
    if (messageData.method === 'getValue') {
        if(controlValueTemperature === undefined) {
            client.publish('v1/devices/me/rpc/response/' + requestId, JSON.stringify(realValueTemperature));
        } else {
            client.publish('v1/devices/me/rpc/response/' + requestId, JSON.stringify(controlValueTemperature));
        }
    } else if (messageData.method === 'setValue') {
        controlValueTemperature = messageData.params;
        console.log('Going to set new control value: ' + controlValueTemperature);
    } else {
        client.publish('v1/devices/me/rpc/response/' + requestId, message);
    }
});


function publishTelemetry() {
    emulateTemperatureChanging();
    client.publish('v1/devices/me/telemetry', JSON.stringify({temperature: realValueTemperature}));
    data.humidity = genNextValue(data.humidity, minHumidity, maxHumidity);
    client.publish('v1/devices/me/telemetry', JSON.stringify({days: 7*Math.exp(a + b * realValueTemperature + c * data.humidity)}));
    client.publish('v1/devices/me/telemetry', JSON.stringify(data));


}

// Generates new random value that is within 3% range from previous value
function genNextValue(prevValue, min, max) {
    var value = prevValue + ((max - min) * (Math.random() - 0.5)) * 0.03;
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * 10) / 10;
}



function emulateTemperatureChanging() {
    if(controlValueTemperature !== undefined) {
        if(controlValueTemperature >= realValueTemperature) {
            realValueTemperature += (Math.random() + (Math.abs(controlValueTemperature - realValueTemperature)/30));
        } else {
            realValueTemperature -= (Math.random() + (Math.abs(controlValueTemperature - realValueTemperature)/30));
        }
    }
}




process.on('SIGINT', function () {
    console.log();
    console.log('Disconnecting...');
    client.end();
    console.log('Exited!');
    process.exit(2);
});

