module('users.wwj.dynatalk').requires().requiresLib({url: 'https://unpkg.com/mqtt/dist/mqtt.min.js', loadTest: function() {return typeof mqtt !== "undefined"; }}).toRun(function() {

// http://localhost:9001/mqtt.min.js
// https://unpkg.com/mqtt/dist/mqtt.min.js

Object.subclass('MQTTSpace', // used global variable: window.space
'default category', {
    initialize: function() {
      // How to create a singleton?
      // Will redefining the constructor modify the behavior of the lively class?
      // Temporarily use a global variable(window.space) to remind that it already exists
      // let space = new MQTTSpace();
      
      if(window.space){
        // throw new Error()
        window.space.mqttClient.end();
        alert("MQTTSpace should only be initialized once.");
      }
      
      this.supervisor = new Supervisor(this);
      
      this.mqttClient = mqtt.connect({
        host:'localhost',
        port:15675,
        username: 'dynalab',
        password: 'dynalab_rmq'
      });
  
      this.mqttClient.on("connect", () => {
        // + : subscribe all
        this.mqttClient.subscribe("+", (err) => {
          if (!err) {
            log("subscribed to +")
          }
        });
      });
  
      this.mqttClient.on("message", (topic, message) => {
        // message is Buffer
        // In lively, functions within objects can be defined dynamically
        this.onMessage(topic, message)
      });
      
      window.space = this;
    },

    _publish: function(topic, payload) {
      // https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientpublishtopic-message-options-callback
      this.mqttClient.publish(topic, payload,{qos:1});
    },
    onMessage: function(topic, payload) {
        log(payload.toString());
        this.supervisor.onMessage(topic, payload);
    },

});
Object.subclass('Agent',
'default category', {

    _receive: function(message) {
      // Receives and handles an incoming message.
      this.current_message = message;
      this.interpret(this.current_message);
    },
    interpret: function(message) {
      // The object interprets the message it understands
      console.debug(`${this.id}: received message`, message)

      if (message.action.name in [this._RESPONSE_ACTION_NAME, this._ERROR_ACTION_NAME]){
        // Handle incoming responses. Only useful when agent is used as callee
        console.debug("Handle incoming responses", message);
      } else {
        // the caller requests the agent to execute the command
        this._commit(message)
      }
    },
    respond_with: function(value) {
      // Sends a response with the given value.
      this.send({
            "meta": {
                "parent_id": this.current_message["meta"]["id"]
            },
            "to": this.current_message['from'],
            "action": {
                "name": this._RESPONSE_ACTION_NAME,
                "args": {
                    "value": value,
                }
            }
        })
    },

    send: function(message) {
      /*
      Sends (out) a message from this agent.
      
      Args:
            message: The message

      Returns:
            The meta.id of the sent message
      */
      
      message["from"] = this.id
      if (!("meta" in message)) {message["meta"]={}}
      message["meta"]["id"] = crypto.randomUUID();
      console.debug(`${this.id}: sending `, message)
      // this._outbound_queue.put(message) // todo loop, now is directly
      this.supervisor.send(message);
      return message["meta"]["id"]
    },

    _commit: function(message) {
      /*
      Invokes the action method

      Args:
            message: The incoming message specifying the action
      */
      try {
        // todo policy
        let action_method = this[message.action.name].bind(this); // function bind to the object 
        action_method(message.action.args);
      } catch(e) {
        let error = `${this.id}: raised exception while committing action "${message['action']['name']}"` + e
        alert(error);
        this.raise_with(error);
      }
    },
    raise_with: function(error) {
        /*
        Sends an error response.

        Args:
            error: The error to send.
        */
        this.send({
            "meta": {
                "parent_id": this.current_message["meta"]["id"],
            },
            "to": this.current_message['from'],
            "action": {
                "name": this._ERROR_ACTION_NAME,
                "args": {
                    "error": `${error}`
                }
            }
        })
        
    },
    initialize: function(supervisor, id, receive_own_broadcasts=false) {
      // let testAgent = new Agent("testAgent")
      this._RESPONSE_ACTION_NAME = "[response]";
      this._ERROR_ACTION_NAME = "[error]";
      
      this.supervisor = supervisor;
      this.id = id; // agent id
      this.current_message = null;
    },
});
Agent.subclass('LivelyDemoAgent',
'default category', {
    echo: function({content=null}) {
      log(`echo: ${content}`)
      this.respond_with(content);
    },
    eval: function({code="1+1"}) {
      let result = eval(code)
      this.respond_with(result); 
    }
});
Object.subclass('Supervisor',
'documentation', {
    documentation: "manage agents",
},
'default category', {
    onMessage: function(topic, payload) {
      // route message to agents
      let message = this.parseToJson(payload); // mutation
      if (message){
        console.debug("(Supervisor) valid message: ", message);
        for (let agent of this.agents){
            if (message.to === agent.id){
              // ignore mqtt topic, just use payload
              agent._receive(message)
            }
        }
      }
    },

    send: function(message) {
        let routing_key = message.to;
        this.space._publish(routing_key, JSON.stringify(message))
    }
    
,

    parseToJson: function(payload) {
        let result;
        try {
            result = JSON.parse(payload.toString()); // json
            // verify, console.assert does not terminate code
            if (this.isValid(result)) {
              return result
            } else {
              log("(Supervisor) bad message")
            }
        } catch(e) {
            alert("Supervisor parseToJson error: " + e);
        }
        return null;
    },
    isValid: function(message) {
      // message: json
      return ("from" in message && "to" in message && "action" in message)
        
    },
    initialize: function(space) {
      this.space = space;
      
      this.agents = [];
      this.initAgents();
    },
    initAgents: function() {
      // todo: Dynamically manage agent life cycle
      this.agents.push(new LivelyDemoAgent(this, "LivelyDemoAgent"));
    },
});


}) // end of module
