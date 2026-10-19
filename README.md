# 01v96 Remote

WORK IN PROGRESS  -- not usable right now  || shortylight

by Michael Strobel

This application is a MIDI bridge to the Yamaha 01v96 mixing console to remote-control it over a network-based connection via WebSocket.

It is based on a node.js server and includes a web client that can be used on both mouse- and touch-based devices.

So far it has implemented

-	controlling faders for channels, aux send, master (aux and bus outputs) and stereo out
-	controlling on-buttons for channels, master and stereo out
-	Showing the meter levels of all channels
-   Configuring channel names and pairs/groups


![01v96 Remote](assets/screenshot.png)



## License

MIT



## Installation

### Installation on a PC / development environment

In order to connect the 01v96 to the PC via USB, please install the latest USB-MIDI driver from [http://www.yamahaproaudio.com/global/en/downloads/firmware_software/](http://www.yamahaproaudio.com/global/en/downloads/firmware_software/)

The node.js server can be obtained at [http://nodejs.org/](http://nodejs.org/)

Install dependencies:

	npm install

**Note for Windows users**

In order to compile the required modules, your system needs to support the python programming language and C++.

-	For python support, install the latest application (from the 2.x branch!) from [http://www.python.org/download/](http://www.python.org/download/)
-	For C++ support, install the Microsoft Visual Studio express from [http://www.microsoft.com/visualstudio/eng/downloads#d-express-windows-desktop](http://www.microsoft.com/visualstudio/eng/downloads#d-express-windows-desktop) or a similar software

**Note for Linux users**

-   If your system is ALSA based, you need to have the *libasound2-dev* package installed in order to compile the midi module.
-   make sure the *config* directory is writable for the node.JS-Server


### Installation on a Raspberry Pi

The application can be deployed to a Raspberry Pi micro computer. It can be connected via USB or configured to receive MIDI signals through its GPIO ports.

The documentation for the installation on a Raspberry Pi can be found in the file *raspberry/documentation.md*


## Usage

### 01v96 MIDI configuration

-	Press the **DIO/SETUP** button and go to the **MIDI/HOST** tab
-	In the *GENERAL* area set both *Rx PORT* and *Tx PORT* to *1*
-	Set the port type to *USB* or *MIDI* depending on how your 01v96 is connected to your server device
-	Press the **MIDI** button and go to the **SETUP** tab
-	Set both the *Tx* and *Rx CHANNEL* to *1*
-	Set *Tx* and *Rx* in the *PARAMETER CHANGE* row to *ON*, all other options to *OFF*
-	Set *Fader Resolution* to *LOW*


### NodeJS server

Start the server from the command line:

	npm start

or

    npm run start

To pass a mixer connection mode, add it after `--`, for example `npm start -- dummy`.

From Windows you can start it with the *01v96-remote-server.bat* file.

The program can only be started when the 01v96 is connected, running and configured correctly. MIDI error messages are shown in the console output.

### Standalone Windows executable

On Windows, install the project dependencies and build the bundled CLI executable:

	npm install
	npm run package:win

The executable is written to `build/01v96-remote.exe`. It includes the Node.js runtime, server dependencies, both web clients, and the Windows MIDI native binary. Run it from a command prompt; it prints the channel-strip client URL and keeps the server diagnostics visible. Open that URL from this PC or another device on the same network.

Use `01v96-remote.exe --mode dummy` to start the test mixer, or `01v96-remote.exe --mode midi --midi-port "01V96 MIDI"` to select a detected MIDI console at startup. The connection selected in the channel-strip client's **MIXER** dialog is saved in `%APPDATA%\01v96-remote\connection.json` and restored on later launches when no startup option overrides it. For MIDI, the device must expose matching 01V96 input and output port names.

The Windows executable offers MIDI and dummy modes. The serial-port adapter remains limited to supported Raspberry Pi/Linux installations.

With an optional parameter, the connection type to the mixer can be chosen:

-   **midi** *(default)* uses the standard MIDI protocol - for MIDI ports and USB connections (also on Raspberry Pi - thanks to @Shad-Rydalch)
-   **serialport** connects through the serial port on */dev/ttyAMA0* (for use with a Raspberry Pi)
-   **dummy** allows to test the application without a real mixer present. It simulates changing fader levels and a moving fader


### Web clients

The existing web client can be accessed at port 1337. The lightweight channel-strip client is available at port 1339 and is designed for touch use in Safari on a 9th-generation iPad. Both clients connect to the WebSocket service on port 1338. Look up browser support at [http://caniuse.com/websockets](http://caniuse.com/websockets).


## Development

The server is written in TypeScript. `npm start` compiles it to `dist/` before launch; run `npm run lint` to check the server sources. Raspberry Pi init scripts run the compiled entry point directly, so run `npm run build` after installing dependencies and whenever server code changes.

### WebSocket protocol

The WebSocket service can be reached on port 1338

#### Messages sent by the server

**Fader value**

Channel groups: Message is sent for every channel

    {
        "type": "fader",
         "target": "channel" / "sum" / "auxsend" / "aux" / "bus",
         "num": < channel/aux/bus number, 0 for sum >,
         "num2": < aux number (if target is "auxsend") >
         "value": < fader value, 0-255 >
    }

**On-buttons**

Channel groups: Message is sent for every channel

    {
        "type": "on",
         "target": "channel" / "sum" / "aux" / "bus",
         "num": < channel/aux/bus number, 0 for sum >,
         "value": < true for on, false for off >
    }

**Channel meter levels**

Sent every 200ms

    {
        "type": "level",
         "levels": {
            < channel number, 1-32 >: < channel level, 0-32 >,
            // ...
         }
    }

**Complete status synchronization**

    {
        "type": "sync",
        "status": {
            "on": {
                "channel< channel number>": < boolean value >,
                "aux< aux number>": < boolean value >,
                "bus< aux number>": < boolean value >,
                "sum0": < boolean value >,
                // ...
            },
            "fader": {
                "channel< channel number>": < value 0-255 >,
                "auxsend< aux number >< channel number>": < value 0-255 >,
                "aux< aux number>": < value 0-255 >,
                "bus< aux number>": < value 0-255 >,
                "sum0": < value 0-255 >,
                // ...
            }
        }
    }

**Configuration**

    {
        "type": "config",
        "config": {
            "names": {
                "channel< channel number>": < name >,
                "aux< aux number>": < name >,
                "bus< aux number>": < name >,
                // ...
            },
            "groups": [
                [ < channel numbers in a group > ],
                // ...
            ]
        }
    }

#### Messages sent by the clients

**Request synchronization**

    {
        "type": "sync"
    }

**Request configuration**

    {
        "type": "config"
    }

**Save configuration**

Triggers a broadcast of the new configuration to all other connected clients

    {
        "type": "config_save",
        "config": {
            "names": {
                "channel< channel number>": < name >,
                "aux< aux number>": < name >,
                "bus< aux number>": < name >,
                // ...
            },
            "groups": [
                [ < channel numbers in a group > ],
                // ...
            ]
        }
    }

**Fader value**

Triggers a broadcast of the new value to all other connected clients

Channel groups: Has to be send only for one channel. Broadcast to other clients contains all channels in the group

    {
        "type": "fader",
         "target": "channel" / "sum" / "auxsend" / "aux" / "bus",
         "num": < channel/aux/bus number, 0 for sum >,
         "num2": < aux number (if target is "auxsend") >
         "value": < fader value, 0-255 >
    }


**On-button**

Triggers a broadcast of the new value to all other connected clients

Channel groups: Has to be send only for one channel. Broadcast to other clients contains all channels in the group

    {
        "type": "on",
         "target": "channel" / "sum" / "aux" / "bus",
         "num": < channel/aux/bus number, 0 for sum >,
         "value": < true for on, false for off >
    }


## Additional notes

### Third party software

NPM modules

-   uws - https://github.com/uWebSockets/uWebSockets
-   midi - https://github.com/justinlatimer/node-midi
-   serialport - https://github.com/voodootikigod/node-serialport

Libraries

-	jQuery - http://jquery.com/
-	FastClick - https://github.com/ftlabs/fastclick
-	Font Awesome icons - http://fortawesome.github.io/Font-Awesome/
