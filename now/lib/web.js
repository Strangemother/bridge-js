var defaultOptions = {
  host: 'http://192.168.2.109:8080'
}

function WebConnection(onReady, onMessage, options) {
  var self = this;

  this.onMessage = onMessage;
  
  // Merge passed in options into default options
  this.options = util.extend(defaultOptions, options);
  
  this.sock = new SockJS(this.options.url, this.options.protocols, this.options.sockjs);
  this.sock.onopen = function() {
    self.clientId = this.sock._connid;
    onReady();
  };
  this.sock.onmessage = self.onData;
  this.sock.onclose = function() {
    util.warn("WebConnection closed");
  };
}

util.inherit(WebConnection, Connection);

WebConnection.prototype.onData = function(message) {
  var self = this;
  try {
    var message = util.parse(message);    
    self.onMessage(message);
  } catch (e) {
    util.error("Message parsing failed: ", e.message, e.stack);
  }
}

WebConnection.prototype.send = function(routingKey, message, links) {
  util.info('Sending', routingKey, message, links);
  // Adding links that need to be established to headers
  var headers = {};
  for (x in links) {
    headers['link_' + x] = links[x];
  }
  // Push message
  this.sock.send(util.stringify({message: message, routingKey: routingKey, headers: headers}));
}

WebConnection.prototype.joinWorkerPool = function(name) {
  util.info('Joined worker pool', name);
  this.sock.send(util.stringify({type: 'joinWorkerPool', name: name}));
}

var NowConnection = WebConnection;