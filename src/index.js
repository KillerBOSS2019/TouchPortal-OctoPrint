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
var octoprint_names = []

const states_templete = [
    { id: "printerState", desc: "Printer state", defaultValue: "Offline" },
    { id: "completion", desc: "Percentage of print completion", defaultValue: "" },
    { id: "filepos", desc: "Bytes printed from start of print", defaultValue: "" },
    { id: "printTime", desc: "Print time", defaultValue: "0" },
    { id: "printTimeLeft", desc: "Print time left", defaultValue: "0" },
    { id: "printTimeLeftOrigin", desc: "Print time left origin", defaultValue: "0" },
    { id: "bedTargetTemp", desc: "Print bed target temperature", defaultValue: "0" },
    { id: "bedoffsetTemp", desc: "Print bed offset temperature", defaultValue: "0" },
    { id: "bedActualTemp", desc: "Print bed actual temperature", defaultValue: "0" },
    { id: "tool0TargetTemp", desc: "Print nozzle target temperature", defaultValue: "0" },
    { id: "tool0offsetTemp", desc: "Print nozzle offset temperature", defaultValue: "0" },
    { id: "tool0ActualTemp", desc: "Print nozzle actual temperature", defaultValue: "0" },
    { id: "chamberTargetTemp", desc: "Print chamber target temperature", defaultValue: "0" },
    { id: "chamberoffsetTemp", desc: "Print chamber offset temperature", defaultValue: "0" },
    { id: "chamberActualTemp", desc: "Print chamber actual temperature", defaultValue: "0" },
    { id: "fileName", desc: "Printing file name", defaultValue: "" },
    { id: "fileSize", desc: "Printing file sizes in bytes", defaultValue: "0" },
    { id: "fileDate", desc: "Printing file uploaded date", defaultValue: "0/0/00" },
    { id: "estimatedPrintTime", desc: "Estimated print time", defaultValue: "0:00" },
    { id: "adveragePrintTime", desc: "Adverage print time", defaultValue: "0:00" },
    { id: "filamentLength", desc: "Filament length required to print in mm", defaultValue: "0:00" },
    { id: "printerName", desc: "Printer name", defaultValue: "" },
    { id: "cameraView", desc: "Printer camera view", defaultValue: "" }
]


async function urlToBase64(url) {
    let image = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(image.data).toString('base64');
}

function sec2time(timeInSeconds) {
    if (timeInSeconds === null) {
        return "00:00:00"
    }
    var pad = function (num, size) { return ('000' + num).slice(size * -1); },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60)

    return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
}

function generateState(parentName) {
    console.log(parentName + "from genState")
    const base_state_id = `${pluginId}.state.${parentName}.`
    let new_states = []
    states_templete.forEach((state) => {
        new_states.push(base_state_id + state.id)
        TPClient.createState(
            new_states[new_states.length - 1], state.desc,
            state.defaultValue, parentName
        )
    })
    return new_states
}

async function updateState(parentName, tempInfo, current, snapshot) {
    const base_state_id = `${pluginId}.state.${parentName}.`
    const image = await urlToBase64(snapshot);
    if (!current.job.filament) {
        current.job.filament = { tool0: { length: null, target: null, offset: null, actual: null } }
    }
    const value = [
        current.state.text,
        Math.round(current.progress.completion >= 0 ? current.progress.completion : 0 * 100),
        current.progress.filepos,
        sec2time(current.progress.printTime),
        sec2time(current.progress.printTimeLeft),
        current.progress.printTimeLeftOrigin,
        tempInfo.bed.target,
        tempInfo.bed.offset,
        tempInfo.bed.actual,
        tempInfo.tool0.target,
        tempInfo.tool0.offset,
        tempInfo.tool0.actual,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.target : 0,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.offset : 0,
        (tempInfo.hasOwnProperty("chamber")) ? tempInfo.chamber.actual : 0,
        current.job.file.name || "None",
        current.job.file.size,
        new Date(current.job.file.date),
        sec2time(current.job.estimatedPrintTime),
        sec2time(current.job.adveragePrintTime),
        current.job.filament.tool0.length || "0",
        parentName,
        image
    ]
    states_templete.forEach((state) => {
        const state_index = states_templete.indexOf(state)
        TPClient.stateUpdate(base_state_id + state.id, value[state_index])
        // console.log(`{
        //     "id": "${pluginId}.state.dynamic.${state.id}",
        //     "type": "text",
        //     "desc": "${state.desc}",
        //     "default": "${state.defaultValue}"
        // },`)
    })
}

// After join to Touch Portal, it sends an info message
// handle it here
TPClient.on("Info", (data) => {
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
            OP_instance.states = generateState(OP_instance.printer_name)
            octoprint_names.push(OP_instance.printer_name)
            TouchPortalEntry.categories[0].actions.forEach((entry_action) => {
                const choiceUpdateId = entry_action.data[0].id
                try {
                    TPClient.choiceUpdate(choiceUpdateId, octoprint_names)
                } catch (error) {}
            })
        })
        OP_instance.on("current", async (data) => {
            //   console.log(data.current)
            await OP_instance.getPrinterState().then(async (temp) => {
                await updateState(
                    OP_instance.printer_name,
                    temp.data.temperature,
                    data.current,
                    OP_instance.snapshot_url
                )
            }).catch((err) => {
                console.log("connection losted")
            })
        })
        OP_instance.on("error", (err) => {
            console.log(err)
        })
        console.log(OP_instance.ws_url)
        OP_instance.connect()
    })
});

function getFloat(num) {
    if (isNaN(num)) { return 0; }
    return parseFloat(num)
  }

// Object to hold actionId of held actions
let heldAction = {};

// Receive an Action Call from Touch Portal
TPClient.on("Action", (data, hold) => {
    const entry_actions = TouchPortalEntry.categories[0].actions;

    //Track the action being held
    if (hold) {
        heldAction[data.actionId] = true;
    }
    else if (!hold) {
        delete heldAction[data.actionId];
    }
    // console.log(data)
    octoprint_instances.forEach(async instance => {
        if (instance.printer_name === data.data[0].value) {
            if (data.actionId == entry_actions[2].id) {
                var axesOptions = {"command": "jog"}
                const axes_distances = getFloat(data.data[2].value);

                if (data.data[1].value === "Z") {
                    axesOptions.z = axes_distances
                } else if (data.data[1].value === "X") {
                    axesOptions.x = axes_distances
                } else if (data.data[1].value === "Y") {
                    axesOptions.y = axes_distances
                }

                await instance.printHead(axesOptions)
            } else if (data.actionId == entry_actions[1].id) {
                var axesOptions = {"command": "home", "axes": []}

                if (data.data[1].value === "X") {
                    axesOptions.axes.push("x")
                } else if (data.data[1].value === "Y") {
                    axesOptions.axes.push("y")
                } else if (data.data[1].value === "Z") {
                    axesOptions.axes.push("z")
                } else if (data.data[1].value === "All") { 
                    axesOptions.axes = ["x", "y", "z"]
                }
                // console.log(axesOptions)
                await instance.printHead(axesOptions)
            }
        }
    });
});

TPClient.on("Close", (data) => {
    octoprint_instances.forEach((instance) => {
        console.log(`Shutting down ${instance.printer_name}`)
        instance.close()
    })
})

//Connects and Pairs to Touch Portal via Sockete Socket
TPClient.connect({ pluginId });