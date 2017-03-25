/*
 *Author:Arihant Chhajed
 *Language:Node.JS
 *License:Free
*/


//Initialization
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var json_body_parser = bodyParser.json();//this is used to prevent empty reponse in api.ai
var request = require('request');
app.use(bodyParser.json());
var path = require("path");
var net = require('net'),
    JsonSocket = require('json-socket');
//const proxy='http://proxy.tcs.com:8080';// or blank for without proxy
const proxy = '';

var port = 9838;
var server = net.createServer();
server.listen(port);

  
	app.post('/fallback',json_body_parser, function (req, res) //2nd parameter is used to prevent empty string error in api.ai
	{
		var pollingResponse=[];
		res.set('Content-Type', 'application/json');
		var options = 
		{ 
			method: 'POST',
			url: 'https://helpdeskserver.herokuapp.com/sendtohelpdesk',
			headers: 
			{ 
				'cache-control': 'no-cache',
				'content-type': 'application/json' 
			},
			body: { query: req.body.result.resolvedQuery,sessionId: req.body.sessionId },
			json: true 
		};
		console.log(options);
		request(options, function (error, response, body) 
		{
			if (error) 
			{
				console.log("API call Failed")
				var errorResponse=
				{
					"status": 
					{
						"code": 206,
						"errorType": "partial_content",
						"errorDetails": "Webhook call failed. Status code 503. Error:503 Service Unavailable"
					}
				}
				res.end(JSON.stringify(errorResponse));
				throw new Error(error);
			}
			else
			{
				if(body!=null)
				{	
					var fulfillment=
					{
						"speech": body,
						"source": "Arcsoftech-Webhook",
						"displayText": body
					}
					res.end(JSON.stringify(fulfillment));
				}
				else
				{
					
					server.on('connection', function(socket) 
					{ //This is a standard net.Socket
                    //socket.connect();
					socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
					socket.on('message', function(message) 
					{
						var result = message.a + message.b;
						console.log(message);
						var fulfillment=
					{
						"speech": message.message,
						"source": "Arcsoftech-Webhook",
						"displayText": message.message
					}
					//socket.disconnect();
					res.end(JSON.stringify(fulfillment));
					console.log("sent")
					
						//socket.sendEndMessage({result: result});
					});
					});
				}
			}
		});
	});



   // });




app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
   response.sendFile(path.join(__dirname+'/template.html'));
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});
