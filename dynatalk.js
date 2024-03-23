module('users.wwj.dynatalk').requires().requiresLib({url: 'https://unpkg.com/mqtt/dist/mqtt.min.js', loadTest: function() {return typeof mqtt !== "undefined"; }}).toRun(function() {

// http://localhost:9001/mqtt.min.js
// https://unpkg.com/mqtt/dist/mqtt.min.js

Object.subclass('MQTTSpace', // used global variable: window.space
'initialize-release', {
  initialize: function(aSupervisor) {
    // How to create a singleton?
    // Will redefining the constructor modify the behavior of the lively class?
    
    this.supervisor = aSupervisor;
    
    if(window.mqttClient){
      // Temporarily use a global variable(window.supervisor) to remind that it already exists
      // throw new Error()
      window.mqttClient.end();
      console.warn("Make sure there is only one mqtt client!");
    }
    
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
    
    window.mqttClient = this.mqttClient;
    
  },

},
'default category', {
    _publish: function(topic, payload) {
      // https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientpublishtopic-message-options-callback
      this.mqttClient.publish(topic, payload,{qos:1});
    },
    onMessage: function(topic, payload) {
        console.debug(`(space) onMessage: ${payload.toString()}`);
        // Prevent the mqtt message process from being broken
        try{
          this.supervisor.onMessage(topic, payload);
        } catch(e) {
          console.error(e);
        }
        
    },
});
Object.subclass('Agent',
'debugging', {},
'evaluating', {
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
      console.error(error);
      this.raise_with(error);
    }
  },
  interpret: function(message) {
    // The object interprets the message it understands

    if (this._RESPONSE_ACTION_NAME === message.action.name) {
      // Handle incoming responses. Only useful when agent is used as callee
      console.debug("Handle incoming response", message);
      // process _promises
      this._promises[message.meta.parent_id] && this._promises[message.meta.parent_id].resolve(message.action.args.value);
      delete this._promises[message.meta.parent_id];
    } 
    else if (this._ERROR_ACTION_NAME === message.action.name){
      console.debug("Handle incoming error", message);
      // process _promises
      this._promises[message.meta.parent_id] && this._promises[message.meta.parent_id].reject(message.action.args.error);
      delete this._promises[message.meta.parent_id];
    }
    else {
      // the caller requests the agent to execute the command
      this._commit(message)
    }
  },
},
'initialize-release', {
  initialize: function(supervisor, id, receive_own_broadcasts=false) {
    // let testAgent = new Agent("testAgent")
    this._RESPONSE_ACTION_NAME = "[response]";
    this._ERROR_ACTION_NAME = "[error]";
    this._promises = {}; // for request;
    
    this.supervisor = supervisor;
    this.id = id; // agent id
    this.current_message = null;
  },
},
'receiving', {
  _receive: function(message) {
    // Receives and handles an incoming message.
    console.debug(`(${this.id}) received message`, message)
    this.current_message = message;
    this.interpret(this.current_message);
  },
},
'sending', {
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
  request: function(message, timeout=3000) {
    // send and wait the response
    // timeout 3000 ms
    let msg_id = this.send(message);
    
    return new Promise((resolve, reject) => {
        this._promises[msg_id] = {resolve:resolve, reject:reject};
        setTimeout(() => {
            if (this._promises[msg_id]){
                console.debug(this._promises);
                let error = `request(${msg_id}) timeout(${timeout}ms)`;
                console.error(error);
                reject(error);
            }
        }, timeout);
    });
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
    console.debug(`(${this.id}) sending `, message)
    // this._outbound_queue.put(message) // todo loop, now is directly
    this.supervisor.send(message);
    return message["meta"]["id"]
  },

},
'converting', {},
'default category', {

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
'accessing', {
  getAgent: function(agentID) {
    return this.agents[agentID]
  },
},
'converting', {
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
},
'initialize-release', {
  initialize: function() {
    // let supervisor = new Supervisor();
    //  supervisor.getAgent('LivelyDemoAgent')
    this.agents = {};
    this.initAgents();
    
    this.space = new MQTTSpace(this);
  },
  initAgents: function() {
    // todo: Dynamically manage agent life cycle
    let name = "LivelyDemoAgent";
    this.agents[name] = new LivelyDemoAgent(this, name);
  },
},
'testing', {
  isValid: function(message) {
    // message: json
    return ("from" in message && "to" in message && "action" in message)
  },
},
'documentation', {
    documentation: "manage agents",
},
'default category', {
    onMessage: function(topic, payload) {
      // route message to agents
      let message = this.parseToJson(payload); // mutation
      if (message){
        console.debug("(Supervisor) valid message: ", message);
        
        if (message.to in this.agents){
          this.agents[message.to]._receive(message)
        }
      }
    },

    send: function(message) {
        let routing_key = message.to;
        this.space._publish(routing_key, JSON.stringify(message))
    },
});


}) // end of module
