const AdmZip = require("adm-zip");
const path  = require("path");
const fs = require("fs");
const pkg = require("pkg");
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"))
const { exit } = require("process")

const build = async(platform) => {
    fs.mkdirSync(`./base/${platform}`)
    fs.copyFileSync("./src/entry.tp", `./base/${platform}/entry.tp`)
    fs.copyFileSync("./base/plugin_icon.png", `./base/${platform}/${packageJson.name}.png`)

    let nodeVersion = 'node16-win-x64'
    let execName = `${packageJson.name}.exe`

    if( platform != "Windows" ) {
        execName = packageJson.name
        fs.copyFileSync("./base/start_plugin.sh", `./base/${platform}/start_plugin.sh`)
    }

    if( platform == "MacOS") {
        nodeVersion = 'node16-macos-x64'
        
    }
    if( platform == "MacOS-Arm64") {
        nodeVersion = '???'
    }
    if( platform == "Linux") {
        nodeVersion = 'node16-linux-x64'
    }

    console.log("Running pkg")
    await pkg.exec([
      "--targets",
      nodeVersion,
      "--output",
      `base/${platform}/${execName}`,
      ".",
    ]);
    
    console.log("Running Zip File Creation")
    const zip = new AdmZip()
    zip.addLocalFolder(
      path.normalize(`./base/${platform}/`),
      packageJson.name
    );
    
    zip.writeZip(path.normalize(`./Installers/${packageJson.name}-${platform}-${packageJson.version}.tpp`))

    console.log("Cleaning Up")
    fs.rmSync(`./base/${platform}`, { recursive:true })
}

const cleanInstallers  = () => {
    try {
      fs.rmSync('./Installers/', { recursive : true})
      fs.mkdirSync('./Installers/')
      } catch (err) {
        console.error(err);
      }
}

const executeBuilds= async () => {
    cleanInstallers()
    await build("Windows")
    await build("MacOS")
    await build("Linux")
}

executeBuilds();