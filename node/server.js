var WebSocketServer = require('ws').Server;
var ws = new WebSocketServer({ port: 8895 });

ws.on('listening', function () {
	console.log("Server started with port 8895");
});

ws.on('connection', function (connection) {

    console.log("User is connected");
    connection.send("Hello from server");
    
    /* Action to do when user send messages */
    connection.on('message', function (message) {
        
        console.log("Message from user");
    });

    
    /* Action to do When user try to close the connection */
    connection.on('close', function () {
        console.log("Disconnecting user"); 
    });  
   
});