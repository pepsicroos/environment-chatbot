const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v2.6/';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      const webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      const senderPsid = webhook_event.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(senderPsid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(senderPsid, webhook_event.postback);
      }


    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }


  



});

// Handle incoming messages to bot
function handleMessage(senderPsid, received_message) {
  let response;

  if (received_message.text) {
      response = {
          "text": `Tu mensaje fue: "${received_message.text}".`
      };

  } else {
      response = {
          "text": `Perdon, no te entendi.`
      }
  }
  callSendAPI(senderPsid, response);//
}


function callSendAPI(senderPsid, response) {
  // Construct the message body
  console.log('message to be sent: ', response);
  const request_body = {
    "recipient": {
      "id": senderPsid
    },
    "message": response
  }

  request({
    "uri": 'https://graph.facebook.com/v2.6/me/messages',
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    console.log("Message Sent Response body:", body);
    if (err) {
      console.error("Unable to send message:", err);
    }
  });

}





