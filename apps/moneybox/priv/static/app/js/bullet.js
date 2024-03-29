
// N2O Bullet

function bullet(url) {

    var CONNECTING = 0;
    var OPEN = 1;
    var CLOSING = 2;
    var CLOSED = 3;

    var transports = {

        websocket: function() {
            var transport = null;
            if (window.WebSocket) { transport = window.WebSocket; }
            if (transport) { return {'heart': true, 'transport': transport}; }
            return null;
        }

    };

    var tn = 0;
    function next() {
        var c = 0;

        for (var f in transports) {
            if (tn == c) {
                var t = transports[f]();
                if (t) { var ret = new t.transport(url); ret.heart = t.heart; return ret; }
                tn++;
            }
            c++;
        }
        return false;
    }

    var stream = new function() {
        var isClosed = true;
        var readyState = CLOSED;
        var heartbeat;
        var delay = 80;
        var delayDefault = 80;
        var delayMax = 10000;

        var transport;
        function init() {

            isClosed = false;
            readyState = CONNECTING;
            transport = next();

            if (!transport) {
                delay = delayDefault;
                tn = 0;
                stream.ondisconnect();
                setTimeout(function(){init();}, delayMax);
                return false;
            }

            transport.onopen = function() {
                delay = delayDefault;
                if (transport.heart) heartbeat = setInterval(function(){stream.onheartbeat();}, 4000);
                if (readyState != OPEN) { readyState = OPEN; stream.onopen(); }
            };

            transport.onclose = function() {
                if (isClosed) { return; }

                transport = null;
                clearInterval(heartbeat);

                if (readyState == CLOSING){
                    readyState = CLOSED;
                    stream.onclose();
                } else {
                    if (readyState == CONNECTING) tn++;
                    delay *= 2;
                    if (delay > delayMax) { delay = delayMax; }
                    isClosed = true;
                    setTimeout(function() { init(); }, delay);
                }
            };
            transport.onerror = transport.onclose;
            transport.onmessage = function(e) { stream.onmessage(e); };
        }

        init();

        this.onopen = function(){};     this.oninit = function(){};
        this.onmessage = function(){};  this.ondisconnect = function(){ initialized = false; };
        this.onclose = function(){};    this.onheartbeat = function(){ return this.send('PING'); };

        this.setURL = function(newURL) { url = newURL; };
        this.send = function(data) { if (transport) return transport.send(data); else return false; };
        this.close = function() { readyState = CLOSING; if (transport) transport.close(); };
    };

    return stream;
}
