
# TouchPortal-OctoPrint
- [TouchPortal OctoPrint](#TouchPortal-OctoPrint)
  - [Description](#description) 
  - [Settings Overview](#Settings-Overview)
  - [Features](#Features)
    - [Actions](#actions)
        - [TouchPortal OctoPrint](#com.github.killerboss2019.TPPlugins.OctoPrint.mainactions)
    - [States](#states)
        - [TouchPortal OctoPrint](#com.github.killerboss2019.TPPlugins.OctoPrint.mainstates)
  - [Bugs and Support](#bugs-and-suggestion)
  - [License](#license)
  
# Description

This documentation generated for TouchPortal OctoPrint V1000 with [Python TouchPortal SDK](https://github.com/KillerBOSS2019/TouchPortal-API).

## Settings Overview
| Read-only | Type | Default Value |
| --- | --- | --- |
| False | text |  |

List of octoprint url to octoprint separated by comma.

| Read-only | Type | Default Value |
| --- | --- | --- |
| False | text |  |

List of API Keys in same order as Hosts separated by comma.


# Features

## Actions
<details open id='com.github.killerboss2019.TPPlugins.OctoPrint.mainactions'><summary><b>Category:</b> TouchPortal OctoPrint <small><ins>(Click to expand)</ins></small></summary><table>
<tr valign='buttom'><th>Action Name</th><th>Description</th><th>Format</th><th nowrap>Data<br/><div align=left><sub>choices/default (in bold)</th><th>On<br/>Hold</sub></div></th></tr>
<tr valign='top'><td>Print Job control</td><td>Ability to select a printer and Start, Cancel, Restart, Pause, Resume and TogglePause prints.</td><td>Printer[1][2] print job</td><td><ol start=1><li>Type: choice &nbsp; 
&lt;empty&gt;</li>
<li>Type: choice &nbsp; 
Default: <b>Start</b> Possible choices: ['Start', 'Cancel', 'Restart', 'Pause', 'Resume', 'TogglePause']</li>
</ol></td>
<td align=center>No</td>
<tr valign='top'><td>Home axes</td><td>Home selected printer X, Y, Z or All axes</td><td>[1] Home[2]axes</td><td><ol start=1><li>Type: choice &nbsp; 
&lt;empty&gt;</li>
<li>Type: choice &nbsp; 
Default: <b>All</b> Possible choices: ['All', 'X', 'Y', 'Z']</li>
</ol></td>
<td align=center>No</td>
<tr valign='top'><td>Moving axes</td><td>Moving selected printer axes by X mm</td><td>Move[1][2]by[3]mm</td><td><ol start=1><li>Type: choice &nbsp; 
&lt;empty&gt;</li>
<li>Type: choice &nbsp; 
Default: <b>X</b> Possible choices: ['X', 'Y', 'Z']</li>
<li>Type: text &nbsp; 
Default: <b>1</b></li>
</ol></td>
<td align=center>No</td>
<tr valign='top'><td>Set target temperature</td><td>Change selected printer bed or nozzle temperature.</td><td>[1]Set target temperature to[2]°C</td><td><ol start=1><li>Type: choice &nbsp; 
&lt;empty&gt;</li>
<li>Type: text &nbsp; 
&lt;empty&gt;</li>
</ol></td>
<td align=center>No</td>
</tr></table></details>
<br>

## States
<details open id='com.github.killerboss2019.TPPlugins.OctoPrint.mainstates'><summary><b>Category:</b> TouchPortal OctoPrint <small><ins>(Click to expand)</ins></small></summary>


| Id | Description | DefaultValue | parentGroup |
| --- | --- | --- | --- |
| .state.dynamic.printerState | Printer state | Offline |   |
| .state.dynamic.completion | Percentage of print completion |  |   |
| .state.dynamic.filepos | Bytes printed from start of print |  |   |
| .state.dynamic.printTime | Print time | 0 |   |
| .state.dynamic.printTimeLeft | Print time left | 0 |   |
| .state.dynamic.printTimeLeftOrigin | Print time left origin | 0 |   |
| .state.dynamic.bedTargetTemp | Print bed target temperature | 0 |   |
| .state.dynamic.bedoffsetTemp | Print bed offset temperature | 0 |   |
| .state.dynamic.bedActualTemp | Print bed actual temperature | 0 |   |
| .state.dynamic.tool0TargetTemp | Print nozzle target temperature | 0 |   |
| .state.dynamic.tool0offsetTemp | Print nozzle offset temperature | 0 |   |
| .state.dynamic.tool0ActualTemp | Print nozzle actual temperature | 0 |   |
| .state.dynamic.chamberTargetTemp | Print chamber target temperature | 0 |   |
| .state.dynamic.chamberoffsetTemp | Print chamber offset temperature | 0 |   |
| .state.dynamic.chamberActualTemp | Print chamber actual temperature | 0 |   |
| .state.dynamic.fileName | Printing file name |  |   |
| .state.dynamic.fileSize | Printing file sizes in bytes | 0 |   |
| .state.dynamic.fileDate | Printing file uploaded date | 0/0/00 |   |
| .state.dynamic.estimatedPrintTime | Estimated print time | 0:00 |   |
| .state.dynamic.adveragePrintTime | Adverage print time | 0:00 |   |
| .state.dynamic.filamentLength | Filament length required to print in mm | 0:00 |   |
| .state.dynamic.printerName | Printer name |  |   |
| .state.dynamic.cameraView | Printer camera view |  |   |
</details>

<br>

# Bugs and Suggestion
Open an issue on github or join offical [TouchPortal Discord](https://discord.gg/MgxQb8r) for support.


# License
This plugin is licensed under the [GPL 3.0 License] - see the [LICENSE](LICENSE) file for more information.

