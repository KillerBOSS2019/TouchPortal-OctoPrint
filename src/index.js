const TouchPortalAPI = require('touchportal-api');
const fs = require("fs")
const TouchPortalEntry = JSON.parse(fs.readFileSync("./src/entry.tp", "utf8"))
const OctoPrintClient = require("./OctoPrintClient")
const axios = require("axios");

// Create an instance of the Touch Portal Client
const TPClient = new TouchPortalAPI.Client();

// Define a pluginId, matches your entry.tp file
const pluginId = TouchPortalEntry.id;

var octoprint_instances = []

const states_templete = [
    {id: "printerState", desc: "Printer state", defaultValue: "Offline"},
    {id: "bedTargetTemp", desc: "Print bed temperature", defaultValue: "0"},
    {id: "bedoffsetTemp", desc: "Print bed offset temperature", defaultValue: "0"},
    {id: "bedActualTemp", desc: "Print bed actual temperature", defaultValue: "0"},
    {id: "tool0TargetTemp", desc: "Print nozzle target temperature", defaultValue: "0"},
    {id: "tool0offsetTemp", desc: "Print nozzle offset temperature", defaultValue: "0"},
    {id: "tool0ActualTemp", desc: "Print nozzle actual temperature", defaultValue: "0"},
    {id: "chamberTargetTemp", desc: "Print chamber target temperature", defaultValue: "0"},
    {id: "chamberoffsetTemp", desc: "Print chamber offset temperature", defaultValue: "0"},
    {id: "chamberActualTemp", desc: "Print chamber actual temperature", defaultValue: "0"},
    {id: "fileName", desc: "Printing file name", defaultValue: ""},
    {id: "fileSize", desc: "Printing file sizes in bytes", defaultValue: "0"},
    {id: "fileDate", desc: "Printing file uploaded date", defaultValue: "0/0/00"},
    {id: "estimatedPrintTime", desc: "Estimated print time", defaultValue: "0:00"},
    {id: "adveragePrintTime", desc: "Adverage print time", defaultValue: "0:00"},
    {id: "filamentLength", desc: "Filament length required to print in mm", defaultValue: "0:00"},
    {id: "printerName", desc: "Printer name", defaultValue: ""},
    {id: "cameraView", desc: "Printer camera view", defaultValue: ""},
]

// Receive an Action Call from Touch Portal
TPClient.on("Action", (data,hold) => {
  //Track the action being held
  if( hold ) {
    heldAction[message.actionId] = true;
  }
  else if ( !hold ) {
    delete heldAction[message.actionId];
  }
});

async function urlToBase64(url) {
    let image = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(image.data).toString('base64');
}

function sec2time(timeInSeconds) {
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
    time = parseFloat(timeInSeconds).toFixed(3),
    hours = Math.floor(time / 60 / 60),
    minutes = Math.floor(time / 60) % 60,
    seconds = Math.floor(time - minutes * 60),
    milliseconds = time.slice(-3);

    return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}

function generateState(parentName) {
    console.log(parentName + "from genState")
    const base_state_id = `${pluginId}.state.${parentName}.`
    let new_states = []
    states_templete.forEach((state) => {
        new_states.push(base_state_id + state.id)
        TPClient.createState(
            new_states[new_states.length - 1], state.desc,
            state.defaultValue, state.parentName
        )
    })
    return new_states
}

async function updateState(parentName, tempInfo, current, snapshot) {
    const base_state_id = `${pluginId}.state.${parentName}.`
    const image = await urlToBase64(snapshot);
    console.log(current.job)
    const value = [
        current.state.text,
        tempInfo.bed.target,
        tempInfo.bed.offset,
        tempInfo.bed.actual,
        tempInfo.tool0.target,
        tempInfo.tool0.offset,
        tempInfo.tool0.actual,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.target : 0,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.offset : 0,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.actual : 0,
        current.job.file.name,
        current.job.file.size,
        new Date(current.job.file.date),
        sec2time(current.job.estimatedPrintTime),
        sec2time(current.job.adveragePrintTime),
        current.job.filament.tool0.length,
        parentName,
        image
    ]
    states_templete.forEach((state) => {
        const state_index = states_templete.indexOf(state)
        TPClient.stateUpdate(base_state_id + state.id, value[state_index])
    })
}

// After join to Touch Portal, it sends an info message
// handle it here
TPClient.on("Info",(data) => {
  // const octopi = new OctoPrintClient("9CEEE24052024BEB9E55F3EF8C99BB59", "http://192.168.12.144:5002")
  const hosts = data.settings[0].Hosts.split(",");
  const api_keys = data.settings[1]["API Keys"].split(",")
  

  if (hosts && api_keys) {
    hosts.forEach(host => {
      const current_index = hosts.indexOf(host);
      const instance_apikey = api_keys[current_index].trim();
      if (api_keys.length >= current_index && instance_apikey.length === 32) {
        try {
          const octprint_instance = new OctoPrintClient(instance_apikey.trim(), host.trim())
          octoprint_instances.push(octprint_instance)
        } catch (error) {
          this.logIt("error", error)
        }
      }
    });
  }

  octoprint_instances.forEach(OP_instance => {
    OP_instance.on("connected", (data) => {
      console.log(`Connected to ${OP_instance.printer_name}. Generating states`)
      console.log(OP_instance.printer_name)
      OP_instance.states = generateState(OP_instance.printer_name)
    })
    OP_instance.on("current", async (data) => {
    //   console.log(data.current)
      const temp = await OP_instance.getPrinterState()
      console.log(OP_instance.snapshot_url)
      await updateState(
        OP_instance.printer_name,
        temp.data.temperature,
        data.current,
        OP_instance.snapshot_url
      )
    })
    OP_instance.on("error", (err) => {
        console.log(err)
    })
    console.log(OP_instance.ws_url)
    OP_instance.connect()
  })

});

TPClient.on("Close", (data) => {
    octoprint_instances.forEach((instance) => {
        console.log(`Shutting down ${instance.printer_name}`)
        instance.close()
    })
})

//Connects and Pairs to Touch Portal via Sockete Socket
TPClient.connect({ pluginId });