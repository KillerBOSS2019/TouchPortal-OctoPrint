const axios = require('axios');
const WebSocket = require("ws")
const EventEmitter = require('events');

class OctoPrintClient extends EventEmitter{
    constructor(api_key, host) {
        super();

        this.api_key = api_key;
        this.host = host;
        this.ws_url = this.host.replace(/^http/, "ws") + "/sockjs/websocket";
        this.ws = null;
        this.printer_name = null;
        this.snapshot_url = null;
        this.states = []
    }

    #get(endpoint, body=null) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    Authorization: `Bearer ${this.api_key}`,
                    'Content-Type': 'application/json',
                }
            }
            if (body) {
                options.data = body;
            }
        })
    }

    #_octoRequest(method, endpoint, body=null) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    // 'Authorization': "Bearer " + this.api_key,
                    'X-Api-Key': this.api_key,
                    'Content-Type': 'application/json'
                }
            }
            if (body) {
                // options.body = body;
            }
            switch (method) {
                case "GET": {
                    axios
                      .get(this.host + endpoint, options)
                      .then(res => { resolve(res) })
                      .catch(error => { reject(error) })
                    break;
                }
                case "POST": {
                    axios
                      .post(this.host + endpoint, body, options)
                      .then(res => { resolve(res) })
                      .catch(error => { reject(error) })
                    break;
                }
            }
        })
    }

    #login() {
        const options = {
            headers: {
                Authorization: `Bearer ${this.api_key}`,
                'Content-Type': 'application/json',
            }
        }
        return axios
          .post(`${this.host}/api/login`, {passive: true}, options)
          .then(res => res.data)
    }

    async connect() {
        this.ws = new WebSocket(this.ws_url)
        const parent = this;

        this.ws.on('open', async () => {
            await parent.#login().then(data => {
                const payload = `{"auth": "${data.name}:${data.session}"}`
                this.ws.send(`${payload}`)
            })
        });

        this.ws.on('message', async (data) => {
            data = JSON.parse(data);
            const parent = this;
            
            if (data.hasOwnProperty("connected")) {
                await this.#_octoRequest("GET", "/api/settings").then((reqdata) => {
                    parent.printer_name = reqdata.data.appearance.name
                    parent.snapshot_url = reqdata.data.webcam.snapshotUrl
                })
                this.emit("connected", data)
            } else if (data.hasOwnProperty("history")){
                this.emit("history", data)
            } else if (data.hasOwnProperty("timelapse")){
                this.emit("timelapse", data)
            } else if (data.hasOwnProperty("current")) {
                this.emit("current", data)
            } else {
                // console.log(data)
            }
        });

        this.ws.on('close', (data) => {
            this.emit("close", data)
        });
        
        this.ws.on("error", (data) => {
            this.emit("error", data)
        })
    }

    close () {
        this.ws.close()
    }

    getCurrentUser() {
        return this.#_octoRequest("GET", "/api/currentuser")
    }

    getVersion() {
        return this.#_octoRequest("GET", "/api/version")
    }
    
    getServer() {
        return this.#_octoRequest("GET", "/api/version")
    }
    
    getConnection() {
        return this.#_octoRequest("GET", "/api/connection")
    }
    
    connection(command, port = null, baudrate = null, printerProfile = null, save = null, autoconnect = null) {
        // https://docs.octoprint.org/en/master/api/connection.html#id3
        return this.#_octoRequest("POST", "/api/connection", {
            port: port,
            baudrate: baudrate,
            printerProfile: printerProfile,
            save: save,
            autoconnect: autoconnect
        })
    }

    getFiles(recursive=false) {
        return this.#_octoRequest("GET", "/api/files?recursive=" + recursive)
    }

    getJob() {
        return this.#_octoRequest("GET", "/api/job")
    }

    Job(command) {
        /*
        https://docs.octoprint.org/en/master/api/job.html#id2
        Job command allows `start`, `cancel`, `restart`, `pause`, `resume`, or `togglePause`.

        `togglePause` is a custom one, It makes easier to understand what it is.
        */
        if (!(command in ["pause", "resume", "togglePause"])) 
            return this.#_octoRequest("POST", "/api/job", body = { command: command })
        else {
            if (command === "togglePause") { command = "toggle" }
            return this.#_octoRequest("POST", "/api/job", body = { command: "pause", action: command })
        }
    }

    getPrinterState(exclude = "") {
        // https://docs.octoprint.org/en/master/api/printer.html
        return this.#_octoRequest("GET", (exclude.length > 0) ? `/api/printer?exclude=${exclude}` : "/api/printer")
    }

    printHead(options) {
        /*
        Allows you to home one or more axes. available command are jog, home, and feedrate.
        
        arg options *Required* It needs to be in format of dict more info here 
        https://docs.octoprint.org/en/master/api/printer.html#post--api-printer-printhead
        */
        return this.#_octoRequest("POST", "/api/printer/printhead", options)
    }

    printTool(options) {
        /*
        Allows you set temperature terget, offset, select, extrude, flowrate
        
        arg options *Required* It needs to be in format of dict more info here 
        https://docs.octoprint.org/en/master/api/printer.html#post--api-printer-tool
        */
        return this.#_octoRequest("POST", "/api/printer/tool", body=options)
    }

    getPrintTool(history=false, limit=2) {
        /*
        Allows you to get current actual, target and offset data
        https://docs.octoprint.org/en/master/api/printer.html#get--api-printer-tool
        */
        return this.#_octoRequest("GET", "/api/printer/tool?history="+history + "&limit=" + limit)
    }

    setPrintBed(command) {
        return this.#_octoRequest("POST", "/api/printer/bed", body=command)
    }

    getPrintBed(history=false, limit=2) {
        return this.#_octoRequest("GET", "/api/printer/bed?history="+history + "&limit=" + limit)
    }

    setChamber(command) {
        return this.#_octoRequest("POST", "/api/printer/chamber", body=command)
    }
    
    getChamber(history=false, limit=2) {
        return this.#_octoRequest("GET", "/api/printer/chamber?history="+history + "&limit=" + limit)
    }

    runGcode(gcode) {
        return this.#_octoRequest("POST", "/api/printer/command", body={command: gcode})
    }
}

module.exports = OctoPrintClient