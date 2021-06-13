/**
 * 01V96 Remote
 * @author Michael Strobel, michael@kryops.de
 */
var remoteApp = {
	
	/*
	 * PROPERTIES
	 */
	
	/**
	 * application-wide configuration
	 */
	config: {
		// WebSocket server location
		socketHost: window.location.hostname,
		socketPort: 1338,
		
		// maximal CSS top value for .fader-handle elements
		maxHandlePercent: 100,
		
		// maximal value for fader messages
		maxFaderValue: 255,
		
		// empty string for fader names
		emptyName: ' ',
		
		// height difference #content-.fader for computation fallback [e.g. CSS calc(100% - 210px)] 
		faderHeightDifference: 210,

		// height of .fader-handle for computation fallback
		faderHandleHeight: 47,

        // minimum distance to send fader change value
		faderMoveMinValueDistance: 3,
		
		// maximal value for level display
		maxLevelValue: 32,

        // channel, aux and bus count
        channelCount: 32,
        auxCount: 8,
        busCount: 8,
		
		/**
		 * configuration for initial tabs and controls
		 *
		 * tab-id: {
		 *	label: tab-label
		 *	fader: [
		 *		[target, number, big label, number2]
		 *	]
		 * }
		 * targets: channel, sum, aux, bus
		 */
		controls: {
			home: {
				label: "HOME",
				faders: [
					["channel", 1, "1"],
					["channel", 2, "2"],
					["channel", 3, "3"],
					["channel", 4, "4"],
					["channel", 5, "5"],
					["channel", 6, "6"],
					["channel", 7, "7"],
					["channel", 8, "8"],
					["channel", 9, "9"],
					["channel", 10, "10"],
					["channel", 11, "11"],
					["channel", 12, "12"],
					["channel", 13, "13"],
					["channel", 14, "14"],
					["channel", 15, "15"],
					["channel", 16, "16"],
					["channel", 17, "17"],
					["channel", 18, "18"],
					["channel", 19, "19"],
					["channel", 20, "20"],
					["channel", 21, "21"],
					["channel", 22, "22"],
					["channel", 23, "23"],
					["channel", 24, "24"],
					["channel", 25, "25"],
					["channel", 26, "26"],
					["channel", 27, "27"],
					["channel", 28, "28"],
					["channel", 29, "29"],
					["channel", 30, "30"],
					["channel", 31, "31"],
					["channel", 32, "32"],
					["sum", 0, "S"]
				]
			},

			aux1: {
				label: "AUX 1",
				faders: [
					["auxsend", 1, "1", 1],
					["auxsend", 2, "2", 1],
					["auxsend", 3, "3", 1],
					["auxsend", 4, "4", 1],
					["auxsend", 5, "5", 1],
					["auxsend", 6, "6", 1],
					["auxsend", 7, "7", 1],
					["auxsend", 8, "8", 1],
					["auxsend", 9, "9", 1],
					["auxsend", 10, "10", 1],
					["auxsend", 11, "11", 1],
					["auxsend", 12, "12", 1],
					["auxsend", 13, "13", 1],
					["auxsend", 14, "14", 1],
					["auxsend", 15, "15", 1],
					["auxsend", 16, "16", 1],
					["auxsend", 17, "17", 1],
					["auxsend", 18, "18", 1],
					["auxsend", 19, "19", 1],
					["auxsend", 20, "20", 1],
					["auxsend", 21, "21", 1],
					["auxsend", 22, "22", 1],
					["auxsend", 23, "23", 1],
					["auxsend", 24, "24", 1],
					["auxsend", 25, "25", 1],
					["auxsend", 26, "26", 1],
					["auxsend", 27, "27", 1],
					["auxsend", 28, "28", 1],
					["auxsend", 29, "29", 1],
					["auxsend", 30, "30", 1],
					["auxsend", 31, "31", 1],
					["auxsend", 32, "32", 1],
					["sum", 0, "S"]
				]
			},

            aux2: {
                label: "AUX 2",
                faders: [
                    ["auxsend", 1, "1", 2],
                    ["auxsend", 2, "2", 2],
                    ["auxsend", 3, "3", 2],
                    ["auxsend", 4, "4", 2],
                    ["auxsend", 5, "5", 2],
                    ["auxsend", 6, "6", 2],
                    ["auxsend", 7, "7", 2],
                    ["auxsend", 8, "8", 2],
                    ["auxsend", 9, "9", 2],
                    ["auxsend", 10, "10", 2],
                    ["auxsend", 11, "11", 2],
                    ["auxsend", 12, "12", 2],
                    ["auxsend", 13, "13", 2],
                    ["auxsend", 14, "14", 2],
                    ["auxsend", 15, "15", 2],
                    ["auxsend", 16, "16", 2],
					["auxsend", 17, "17", 2],
					["auxsend", 18, "18", 2],
					["auxsend", 19, "19", 2],
					["auxsend", 20, "20", 2],
					["auxsend", 21, "21", 2],
					["auxsend", 22, "22", 2],
					["auxsend", 23, "23", 2],
					["auxsend", 24, "24", 2],
					["auxsend", 25, "25", 2],
					["auxsend", 26, "26", 2],
					["auxsend", 27, "27", 2],
					["auxsend", 28, "28", 2],
					["auxsend", 29, "29", 2],
					["auxsend", 30, "30", 2],
					["auxsend", 31, "31", 2],
					["auxsend", 32, "32", 2],
                    ["sum", 0, "S"]
                ]
            },

            aux3: {
                label: "AUX 3",
                faders: [
                    ["auxsend", 1, "1", 3],
                    ["auxsend", 2, "2", 3],
                    ["auxsend", 3, "3", 3],
                    ["auxsend", 4, "4", 3],
                    ["auxsend", 5, "5", 3],
                    ["auxsend", 6, "6", 3],
                    ["auxsend", 7, "7", 3],
                    ["auxsend", 8, "8", 3],
                    ["auxsend", 9, "9", 3],
                    ["auxsend", 10, "10", 3],
                    ["auxsend", 11, "11", 3],
                    ["auxsend", 12, "12", 3],
                    ["auxsend", 13, "13", 3],
                    ["auxsend", 14, "14", 3],
                    ["auxsend", 15, "15", 3],
                    ["auxsend", 16, "16", 3],
					["auxsend", 17, "17", 3],
					["auxsend", 18, "18", 3],
					["auxsend", 19, "19", 3],
					["auxsend", 20, "20", 3],
					["auxsend", 21, "21", 3],
					["auxsend", 22, "22", 3],
					["auxsend", 23, "23", 3],
					["auxsend", 24, "24", 3],
					["auxsend", 25, "25", 3],
					["auxsend", 26, "26", 3],
					["auxsend", 27, "27", 3],
					["auxsend", 28, "28", 3],
					["auxsend", 29, "29", 3],
					["auxsend", 30, "30", 3],
					["auxsend", 31, "31", 3],
					["auxsend", 32, "32", 3],
                    ["sum", 0, "S"]
                ]
            },

            aux4: {
                label: "AUX 4",
                faders: [
                    ["auxsend", 1, "1", 4],
                    ["auxsend", 2, "2", 4],
                    ["auxsend", 3, "3", 4],
                    ["auxsend", 4, "4", 4],
                    ["auxsend", 5, "5", 4],
                    ["auxsend", 6, "6", 4],
                    ["auxsend", 7, "7", 4],
                    ["auxsend", 8, "8", 4],
                    ["auxsend", 9, "9", 4],
                    ["auxsend", 10, "10", 4],
                    ["auxsend", 11, "11", 4],
                    ["auxsend", 12, "12", 4],
                    ["auxsend", 13, "13", 4],
                    ["auxsend", 14, "14", 4],
                    ["auxsend", 15, "15", 4],
                    ["auxsend", 16, "16", 4],
					["auxsend", 17, "17", 4],
					["auxsend", 18, "18", 4],
					["auxsend", 19, "19", 4],
					["auxsend", 20, "20", 4],
					["auxsend", 21, "21", 4],
					["auxsend", 22, "22", 4],
					["auxsend", 23, "23", 4],
					["auxsend", 24, "24", 4],
					["auxsend", 25, "25", 4],
					["auxsend", 26, "26", 4],
					["auxsend", 27, "27", 4],
					["auxsend", 28, "28", 4],
					["auxsend", 29, "29", 4],
					["auxsend", 30, "30", 4],
					["auxsend", 31, "31", 4],
					["auxsend", 32, "32", 4],
                    ["sum", 0, "S"]
                ]
            },
			
			aux5: {
                label: "AUX 5",
                faders: [
                    ["auxsend", 1, "1", 5],
                    ["auxsend", 2, "2", 5],
                    ["auxsend", 3, "3", 5],
                    ["auxsend", 4, "4", 5],
                    ["auxsend", 5, "5", 5],
                    ["auxsend", 6, "6", 5],
                    ["auxsend", 7, "7", 5],
                    ["auxsend", 8, "8", 5],
                    ["auxsend", 9, "9", 5],
                    ["auxsend", 10, "10", 5],
                    ["auxsend", 11, "11", 5],
                    ["auxsend", 12, "12", 5],
                    ["auxsend", 13, "13", 5],
                    ["auxsend", 14, "14", 5],
                    ["auxsend", 15, "15", 5],
                    ["auxsend", 16, "16", 5],
					["auxsend", 17, "17", 5],
					["auxsend", 18, "18", 5],
					["auxsend", 19, "19", 5],
					["auxsend", 20, "20", 5],
					["auxsend", 21, "21", 5],
					["auxsend", 22, "22", 5],
					["auxsend", 23, "23", 5],
					["auxsend", 24, "24", 5],
					["auxsend", 25, "25", 5],
					["auxsend", 26, "26", 5],
					["auxsend", 27, "27", 5],
					["auxsend", 28, "28", 5],
					["auxsend", 29, "29", 5],
					["auxsend", 30, "30", 5],
					["auxsend", 31, "31", 5],
					["auxsend", 32, "32", 5],
                    ["sum", 0, "S"]
                ]
            },
			
			aux6: {
                label: "AUX 6",
                faders: [
                    ["auxsend", 1, "1", 6],
                    ["auxsend", 2, "2", 6],
                    ["auxsend", 3, "3", 6],
                    ["auxsend", 4, "4", 6],
                    ["auxsend", 5, "5", 6],
                    ["auxsend", 6, "6", 6],
                    ["auxsend", 7, "7", 6],
                    ["auxsend", 8, "8", 6],
                    ["auxsend", 9, "9", 6],
                    ["auxsend", 10, "10", 6],
                    ["auxsend", 11, "11", 6],
                    ["auxsend", 12, "12", 6],
                    ["auxsend", 13, "13", 6],
                    ["auxsend", 14, "14", 6],
                    ["auxsend", 15, "15", 6],
                    ["auxsend", 16, "16", 6],
					["auxsend", 17, "17", 6],
					["auxsend", 18, "18", 6],
					["auxsend", 19, "19", 6],
					["auxsend", 20, "20", 6],
					["auxsend", 21, "21", 6],
					["auxsend", 22, "22", 6],
					["auxsend", 23, "23", 6],
					["auxsend", 24, "24", 6],
					["auxsend", 25, "25", 6],
					["auxsend", 26, "26", 6],
					["auxsend", 27, "27", 6],
					["auxsend", 28, "28", 6],
					["auxsend", 29, "29", 6],
					["auxsend", 30, "30", 6],
					["auxsend", 31, "31", 6],
					["auxsend", 32, "32", 6],
                    ["sum", 0, "S"]
                ]
            },
			
			aux7: {
                label: "AUX 7",
                faders: [
                    ["auxsend", 1, "1", 7],
                    ["auxsend", 2, "2", 7],
                    ["auxsend", 3, "3", 7],
                    ["auxsend", 4, "4", 7],
                    ["auxsend", 5, "5", 7],
                    ["auxsend", 6, "6", 7],
                    ["auxsend", 7, "7", 7],
                    ["auxsend", 8, "8", 7],
                    ["auxsend", 9, "9", 7],
                    ["auxsend", 10, "10", 7],
                    ["auxsend", 11, "11", 7],
                    ["auxsend", 12, "12", 7],
                    ["auxsend", 13, "13", 7],
                    ["auxsend", 14, "14", 7],
                    ["auxsend", 15, "15", 7],
                    ["auxsend", 16, "16", 7],
					["auxsend", 17, "17", 7],
					["auxsend", 18, "18", 7],
					["auxsend", 19, "19", 7],
					["auxsend", 20, "20", 7],
					["auxsend", 21, "21", 7],
					["auxsend", 22, "22", 7],
					["auxsend", 23, "23", 7],
					["auxsend", 24, "24", 7],
					["auxsend", 25, "25", 7],
					["auxsend", 26, "26", 7],
					["auxsend", 27, "27", 7],
					["auxsend", 28, "28", 7],
					["auxsend", 29, "29", 7],
					["auxsend", 30, "30", 7],
					["auxsend", 31, "31", 7],
					["auxsend", 32, "32", 7],
                    ["sum", 0, "S"]
                ]
            },
			
			aux8: {
                label: "AUX 8",
                faders: [
                    ["auxsend", 1, "1", 8],
                    ["auxsend", 2, "2", 8],
                    ["auxsend", 3, "3", 8],
                    ["auxsend", 4, "4", 8],
                    ["auxsend", 5, "5", 8],
                    ["auxsend", 6, "6", 8],
                    ["auxsend", 7, "7", 5],
                    ["auxsend", 8, "8", 8],
                    ["auxsend", 9, "9", 8],
                    ["auxsend", 10, "10", 8],
                    ["auxsend", 11, "11", 8],
                    ["auxsend", 12, "12", 8],
                    ["auxsend", 13, "13", 8],
                    ["auxsend", 14, "14", 8],
                    ["auxsend", 15, "15", 8],
                    ["auxsend", 16, "16", 8],
					["auxsend", 17, "17", 8],
					["auxsend", 18, "18", 8],
					["auxsend", 19, "19", 8],
					["auxsend", 20, "20", 8],
					["auxsend", 21, "21", 8],
					["auxsend", 22, "22", 8],
					["auxsend", 23, "23", 8],
					["auxsend", 24, "24", 8],
					["auxsend", 25, "25", 8],
					["auxsend", 26, "26", 8],
					["auxsend", 27, "27", 8],
					["auxsend", 28, "28", 8],
					["auxsend", 29, "29", 8],
					["auxsend", 30, "30", 8],
					["auxsend", 31, "31", 8],
					["auxsend", 32, "32", 8],
                    ["sum", 0, "S"]
                ]
            },
			
			master: {
				label: "MASTER",
				faders: [
					["aux", 1, "A1"],
					["aux", 2, "A2"],
					["aux", 3, "A3"],
					["aux", 4, "A4"],
					["aux", 5, "A5"],
					["aux", 6, "A6"],
					["aux", 7, "A7"],
					["aux", 8, "A8"],
					["bus", 1, "B1"],
					["bus", 2, "B2"],
					["bus", 3, "B3"],
					["bus", 4, "B4"],
					["bus", 5, "B5"],
					["bus", 6, "B6"],
					["bus", 7, "B7"],
					["bus", 8, "B8"],
					["sum", 0, "S"]
				]
			}
		},

		// arrange properties in grid
		effectProperties: {
			main: [	'Pan','Phase','','',
					'Stereo','Direct','FollowPan','',
					'Bus1','Bus2','Bus3','Bus4',
					'Bus5','Bus6','Bus7','Bus8'],
			gate: [ 'Threshold','Range','','KeyIn',
					'Attac','Decay','','KeyCh',
					'Hold','','','KeyAUX',
					'On','Type','','Link'],
			comp: [ 'Threshold','Ratio','','LocComp',
					'Attac','Release','','',
					'Gain','Knee','','',
					'On','Type','','Link'],
			eq: [   'LowQ','LowMidQ','HiMidQ','HiQ',
					'LowF','LowMidF','HiMidF','HiF',
					'LowG','LowMidG','HiMidG','HiG',
					'On','Mode','LPFOn','HPFOn'],
			delay: ['Time','FBGain','Mix','',
					'','','','',
					'','','','',
					'On','','','']
		},

		effectPropertiesSwitch: ['On', 'Mode', 'Type', 'LPFOn', 'HPFOn', 'LocComp', 'Link', 'KeyIn', 'KeyAUX', 'KeyCh', 'Phase', 'Bus1', 'Bus2', 'Bus3', 'Bus4', 'Bus5', 'Bus6', 'Bus7', 'Bus8', 'Stereo', 'Direct', 'FollowPan'],
		
		// range of properties
		propertyRange: {
			main: {
				Pan: {
					min: -63,
					max: 63,
					label:['']
				},
				Phase: {
					min: 0,
					max: 1,
					label: ['normal', 'invers']
				},
				Stereo: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				FollowPan: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Direct: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus1: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus2: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus3: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus4: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus5: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus6: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus7: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Bus8: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				}
			},
			gate: {
				On: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Link: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				KeyIn: {
					min: 0,
					max: 2,
					label: ['Self', 'Channel', 'AUX']
				},
				KeyAUX: {
					min: 0,
					max: 7,
					label: ['1', '2', '3', '4', '5', '6', '7', '8']
				},
				KeyCh: {
					min: 0,
					max: 11,
					label: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
				},
				Type: {
					min: 0,
					max: 1,
					label: ['Gate', 'Ducking']
				},
				Attac: {
					min: 0,
					max: 120,
					label: ['msec']
				},
				Range: {
					min: -70,
					max: 0,
					label: ['dB']
				},
				Hold: {
					min: 0,
					max: 215,
					label: ['table06']
				},
				Decay: {
					min: 0,
					max: 159,
					label: ['table07']
				},
				Threshold: {
					min: -540,
					max: 0,
					label: ['dB']
				}
			},
			comp: {
				LocComp: {
					min: 0,
					max: 2,
					label: ['Pre EQ', 'Post EQ', 'Post Fader']
				},
				On: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Link: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Type: {
					min: 0,
					max: 3,
					label: ['Comp', 'Expander', 'Compander H', 'Compander S']
				},
				Attac: {
					min: 0,
					max: 120,
					label: ['ms']
				},
				Release: {
					min: 0,
					max: 159,
					label: ['table07']
				},
				Ratio: {
					min: 0,
					max: 15,
					label: ['table08']
				},
				Gain: {
					min: 0,
					max: 180,
					label: ['x 0.1 dB']
				},
				Knee: {
					min: 0,
					max: 5,
					label: ['table10'],
					min1: 0,
					max1: 89
				},
				Threshold: {
					min: -540,
					max: 0,
					label: ['x 0.1 dB']
				}
			},
			eq: {
				Mode: {
					min: 0,
					max: 1,
					label: ['Type 1', 'Type 2']
				},
				LowQ: {
					min: 0,
					max: 41,
					label: ['table11']
				},
				LowF: {
					min: 5,
					max: 124,
					label: ['table12']
				},
				LowG: {
					min: -180,
					max: 180,
					label: ['x 0.1 dB']
				},
				HPFOn: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				LowMidQ: {
					min: 0,
					max: 40,
					label: ['table11']
				},
				LowMidF: {
					min: 5,
					max: 124,
					label: ['table12']
				},
				LowMidG: {
					min: -180,
					max: 180,
					label: ['x 0.1 dB']
				},
				HiMidQ: {
					min: 0,
					max: 40,
					label: ['table11']
				},
				HiMidF: {
					min: 5,
					max: 124,
					label: ['table12']
				},
				HiMidG: {
					min: -180,
					max: 180,
					label: ['x 0.1 dB']
				},
				HiQ: {
					min: 0,
					max: 42,
					label: ['table11']
				},
				HiF: {
					min: 5,
					max: 124,
					label: ['table12']
				},
				HiG: {
					min: -180,
					max: 180,
					label: ['x 0.1 dB']
				},
				LPFOn: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				On: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				}
			},
			delay: {
				On: {
					min: 0,
					max: 1,
					label: ['Off', 'On']
				},
				Mix: {
					min: -100,
					max: 100,
					label: ['']
				},
				FBGain: {
					min: -99,
					max: 99,
					label: ['']
				},
				Time: {
					min: 0,
					max: 43400,
					label: ['Sample']
				}
			},
		},

		table12:  ["16.0Hz", "17.0Hz", "18.0Hz", "19.0Hz", "20.0Hz", "21.2Hz", "22.4Hz", "23.6Hz", "25.0Hz", "26.5Hz", "28.0Hz", "30.0Hz", "31.5Hz", "33.5Hz", "35.5Hz", "37.5Hz", "40.0Hz", "42.5Hz", "45.0Hz", "47.5Hz", "50.0Hz", "53.0Hz", "56.0Hz", "60.0Hz", "63.0Hz", "67.0Hz", "71.0Hz", "75.0Hz", "80.0Hz", "85.0Hz", "90.0Hz", "95.0Hz", "100Hz", "106Hz", "112Hz", "118Hz", "125Hz", "132Hz", "140Hz", "150Hz", "160Hz", "170Hz", "180Hz", "190Hz", "200Hz", "212Hz", "224Hz", "236Hz", "250Hz", "265Hz", "280Hz", "300Hz", "315Hz", "335Hz", "355Hz", "375Hz", "400Hz", "425Hz", "450Hz", "475Hz", "500Hz", "530Hz", "560Hz", "600Hz", "630Hz", "670Hz", "710Hz", "750Hz", "800Hz", "850Hz", "900Hz", "950Hz", "1.00kHz", "1.06kHz", "1.12kHz", "1.18kHz", "1.25kHz", "1.32kHz", "1.40kHz", "1.50kHz", "1.60kHz", "1.70kHz", "1.80kHz", "1.90kHz", "2.00kHz", "2.12kHz", "2.24kHz", "2.36kHz", "2.50kHz", "2.65kHz", "2.80kHz", "3.00kHz", "3.15kHz", "3.35kHz", "3.55kHz", "3.75kHz", "4.00kHz", "4.25kHz", "4.50kHz", "4.75kHz", "5.00kHz", "5.30kHz", "5.60kHz", "6.00kHz", "6.30kHz", "6.70kHz", "7.10kHz", "7.50kHz", "8.00kHz", "8.50kHz", "9.00kHz", "9.50kHz", "10.0kHz", "10.6kHz", "11.2kHz", "11.8kHz", "12.5kHz", "13.2kHz", "14.0kHz", "15.0kHz", "16.0kHz", "17.0kHz", "18.0kHz", "19.0kHz", "20.0kHz", "21.2kHz", "22.4kHz", "23.6kHz"],
		table11:  ["10.0", "9.0", "8.0", "7.0", "6.3", "5.6", "5.0", "4.5", "4.0", "3.5", "3.2", "2.8", "2.5", "2.2", "2.0", "1.8", "1.6", "1.4", "1.2", "1.1", "1.0", "0.90", "0.80", "0.70", "0.63", "0.56", "0.50", "0.45", "0.40", "0.35", "0.32", "0.28", "0.25", "0.22", "0.20", "0.18", "0.16", "0.14", "0.12", "0.11", "0.10", "Low Shelving", "High Shelving", "LPF", "HPF"],
		table10:  ["HARD", "1", "2", "3", "4", "5"],
		table08:  ["1 : 1",  "1.1 : 1",  "1.3 : 1",  "1.5 : 1",  "1.7 : 1",  "2 : 1",  "2.5 : 1",  "3 : 1",  "3.5 : 1",  "4 : 1",  "5 : 1",  "6 : 1",  "8 : 1",  "10 : 1",  "20 : 1",  "∞ : 1"],
		table07:  ["5 ms", "11 ms", "16 ms", "21 ms", "27 ms", "32 ms", "37 ms", "43 ms", "48 ms", "53 ms", "59 ms", "64 ms", "69 ms", "75 ms", "80 ms", "85 ms", "91 ms", "96 ms", "101 ms", "107 ms", "112 ms", "117 ms", "123 ms", "128 ms", "133 ms", "139 ms", "144 ms", "149 ms", "155 ms", "160 ms", "165 ms", "171 ms", "176 ms", "187 ms", "197 ms", "208 ms", "219 ms", "229 ms", "240 ms", "251 ms", "261 ms", "272 ms", "283 ms", "293 ms", "304 ms", "315 ms", "325 ms", "336 ms", "347 ms", "368 ms", "389 ms", "411 ms", "432 ms", "453 ms", "475 ms", "496 ms", "517 ms", "539 ms", "560 ms", "581 ms", "603 ms", "624 ms", "645 ms", "667 ms", "688 ms", "730 ms", "773 ms", "816 ms", "858 ms", "901 ms", "944 ms", "986 ms", "1.02 s", "1.07 s", "1.11 s", "1.15 s", "1.20 s", "1.24 s", "1.28 s", "1.32 s", "1.37 s", "1.45 s", "1.54 s", "1.62 s", "1.71 s", "1.79 s", "1.88 s", "1.96 s", "2.05 s", "2.13 s", "2.22 s", "2.30 s", "2.39 s", "2.47 s", "2.56 s", "2.65 s", "2.73 s", "2.90 s", "3.07 s", "3.24 s", "3.41 s", "3.58 s", "3.75 s", "3.93 s", "4.10 s", "4.27 s", "4.44 s", "4.61 s", "4.78 s", "4.95 s", "5.12 s", "5.29 s", "5.46 s", "5.80 s", "6.14 s", "6.48 s", "6.83 s", "7.17 s", "7.51 s", "7.85 s", "8.19 s", "8.53 s", "8.87 s", "9.21 s", "9.56 s", "9.90 s", "10.2 s", "10.5 s", "10.9 s", "11.6 s", "12.2 s", "12.9 s", "13.6 s", "14.3 s", "15.0 s", "15.7 s", "16.3 s", "17.0 s", "17.7 s", "18.4 s", "19.1 s", "19.7 s", "20.4 s", "21.1 s", "21.8 s", "23.2 s", "24.5 s", "25.9 s", "27.3 s", "28.6 s", "30.0 s", "31.4 s", "32.7 s", "34.1 s", "35.4 s", "36.8 s", "38.2 s", "39.5 s", "40.9 s", "42.3 s"],
		table06:  ["0.02 ms", "0.04 ms", "0.06 ms", "0.08 ms", "0.10 ms", "0.13 ms", "0.15 ms", "0.17 ms", "0.19 ms", "0.21 ms", "0.23 ms", "0.25 ms", "0.27 ms", "0.29 ms", "0.31 ms", "0.33 ms", "0.35 ms", "0.38 ms", "0.40 ms", "0.42 ms", "0.44 ms", "0.46 ms", "0.48 ms", "0.50 ms", "0.52 ms", "0.54 ms", "0.56 ms", "0.58 ms", "0.60 ms", "0.63 ms", "0.65 ms", "0.67 ms", "0.69 ms", "0.73 ms", "0.77 ms", "0.81 ms", "0.85 ms", "0.90 ms", "0.94 ms", "0.98 ms", "1.02 ms", "1.06 ms", "1.10 ms", "1.15 ms", "1.19 ms", "1.23 ms", "1.27 ms", "1.31 ms", "1.35 ms", "1.44 ms", "1.52 ms", "1.60 ms", "1.69 ms", "1.77 ms", "1.85 ms", "1.94 ms", "2.02 ms", "2.10 ms", "2.19 ms", "2.27 ms", "2.35 ms", "2.44 ms", "2.52 ms", "2.60 ms", "2.69 ms", "2.85 ms", "3.02 ms", "3.19 ms", "3.35 ms", "3.52 ms", "3.69 ms", "3.85 ms", "4.02 ms", "4.19 ms", "4.35 ms", "4.52 ms", "4.69 ms", "4.85 ms", "5.02 ms", "5.19 ms", "5.35 ms", "5.69 ms", "6.02 ms", "6.35 ms", "6.69 ms", "7.02 ms", "7.35 ms", "7.69 ms", "8.02 ms", "8.35 ms", "8.69 ms", "9.02 ms", "9.35 ms", "9.69 ms", "10.0 ms", "10.3 ms", "10.6 ms", "11.3 ms", "12.0 ms", "12.6 ms", "13.3 ms", "14.0 ms", "14.6 ms", "15.3 ms", "16.0 ms", "16.6 ms", "17.3 ms", "18.0 ms", "18.6 ms", "19.3 ms", "20.0 ms", "20.6 ms", "21.3 ms", "22.6 ms", "24.0 ms", "25.3 ms", "26.6 ms", "28.0 ms", "29.3 ms", "30.6 ms", "32.0 ms", "33.3 ms", "34.6 ms", "36.0 ms", "37.3 ms", "38.6 ms", "40.0 ms", "41.3 ms", "42.6 ms", "45.3 ms", "48.0 ms", "50.6 ms", "53.3 ms", "56.0 ms", "58.6 ms", "61.3 ms", "64.0 ms", "66.6 ms", "69.3 ms", "72.0 ms", "74.6 ms", "77.3 ms", "80.0 ms", "82.6 ms", "85.3 ms", "90.6 ms", "96.0 ms", "101 ms", "106 ms", "112 ms", "117 ms", "122 ms", "128 ms", "133 ms", "138 ms", "144 ms", "149 ms", "154 ms", "160 ms", "165 ms", "170 ms", "181 ms", "192 ms", "202 ms", "213 ms", "224 ms", "234 ms", "245 ms", "256 ms", "266 ms", "277 ms", "288 ms", "298 ms", "309 ms", "320 ms", "330 ms", "341 ms", "362 ms", "384 ms", "405 ms", "426 ms", "448 ms", "469 ms", "490 ms", "512 ms", "533 ms", "554 ms", "576 ms", "597 ms", "618 ms", "640 ms", "661 ms", "682 ms", "725 ms", "768 ms", "810 ms", "853 ms", "896 ms", "938 ms", "981 ms", "1.02 s", "1.06 s", "1.10 s", "1.15 s", "1.19 s", "1.23 s", "1.28 s", "1.32 s", "1.36 s", "1.45 s", "1.53 s", "1.62 s", "1.70 s", "1.79 s", "1.87 s", "1.96 s"],

        /**
         * persistent configuration that is stored on the server
         */
        persistent: {
            groups: []
        }
	},
	
	/**
	 * current application status
	 */
	status: {
		/*
		 * control status; control-id = target+num2+num
		 * control-id: value
		 */
		
		// current status of the on-buttons
		on: {},
		
		// current fader values
		fader: {},
		
		// current faderPan values
		//faderPan: {},
		
		// current faderName values
		faderName: {},

		// current faderEffect values for all properties of all channels
		faderEffect: {
			main: {
				Pan: {},
			},
		},

		// current faderPair values for all properties
		faderPair: {},
		
		// current channel levels
		level: {},
		
		
		// id of the currently active tab
		activeTab: false,

		// id of the currently active effect tab
		activeEffectTab: false,
		
		// current height of a fader; used for value computation when dragging handle
		faderHeight: 0,
		
		// currently moved faders [id: true]; disabled automatic repositioning on value change
		movedFaders: {},

		// selected fader (for effects)
		selectedFader: 1,
		selectedFaderType: 'channel',

		// selected fader (for properties of effects)
		effectFader: 'Pan',
		
		// initial waiting for document.ready and socket initialization
		pendingOperations: 2,

		// calculate dB value for faders
		calcFaderDB: function(value, target) {
			var faderDB = '';
			if(target == 'channel' || target == 'auxsend') {
				if(value < 3) {
					faderDB = -96;
				} else if(value < 11) {
					faderDB = -90 + (value-3)*5;
				} else if(value < 23) {
					faderDB = -50 + (value-11)*0.8336;
				} else if (value < 43) {
					faderDB = -40 + (value-23)*0.5;
				} else if (value < 79) {
					faderDB = -30 + (value-43)*0.2777;
				} else if (value < 105) {
					faderDB = -20 + (value-79)*0.1924;
				} else if (value < 143) {
					faderDB = -15 + (value-105)*0.1282;
				} else if (value < 179) {
					faderDB = -10 + (value-143)*0.1389;
				} else if (value < 207) {
					faderDB = -5 + (value-179)*0.1785;
				} else {
					faderDB = (value-207)*0.2083;
				}
			} else {
				// sum, aux, bus
				if(value < 3) {
					faderDB = -130;
				} else if(value < 21) {
					faderDB = -120 + (value-3)*2.7776;
				} else if(value < 29) {
					faderDB = -70 + (value-11)*1.25;
				} else if (value < 47) {
					faderDB = -60 + (value-21)*0.5553;
				} else if (value < 75) {
					faderDB = -50 + (value-47)*0.357;
				} else if (value < 105) {
					faderDB = -40 + (value-75)*0.3334;
				} else if (value < 147) {
					faderDB = -30 + (value-105)*0.2380;
				} else if (value < 177) {
					faderDB = -20 + (value-147)*0.1666;
				} else if (value < 203) {
					faderDB = -15 + (value-177)*0.1924;
				} else if (value < 233) {
					faderDB = -10 + (value-203)*0.1666;
				} else {
					faderDB = -5 + (value-233)*0.2273;
				}
			}
			faderDB = Math.round(faderDB);
			if (value < 2) faderDB = '-&infin;';
			return ((faderDB > 0)? '+' : '') + faderDB;
		}
	},
	
	/**
	 * WebSocket connection to the server
	 * @property {WebSocket}
	 */
	connection: false,
	
	
	/*
	 * METHODS
	 */

	
	/**
	 * initializes the application
	 */
	init: function() {
		var app = this;
		
		app.openSocketConnection();
		
		// generate content and bind event handlers when page is loaded
		$(document).ready(function() {
			app.bindGlobalEventHandlers();
			app.generatePage();
			app.refreshFaderHeight();
			
			app.start();
		});
	},
	
	/**
	 * counts down the pendingOperations status and syncs with the mixer
	 * when the entire application is loaded
	 */
	start: function() {
		
		// start after socket init and document.ready
		this.status.pendingOperations--;
		
		if(this.status.pendingOperations > 0) {
			return;
		}
		
		// sync with mixer
		$('#loading-dialog-text').html('Syncing with the mixing console...');

        this.sendMessage({
            type: "sync"
        });

        // load configuration

/*		this.sendMessage({
            type: "config"
        }); */

        this.hideError();
	},
	
	/**
	 * opens the WebSocket and binds message and error handlers
	 */
	openSocketConnection: function() {
		var app = this;
		
		window.WebSocket = window.WebSocket || window.MozWebSocket;
		
		if(!window.WebSocket) {
			$(document).ready(function() {
				app.displayError('Your browser does not support WebSockets!<br />Please use a modern browser like Mozilla Firefox or Google Chrome.');
			});
			
			return;
		}
		
		app.connection = new WebSocket('ws://' + app.config.socketHost + ':' + app.config.socketPort);
		
		app.connection.onopen = function () {
			app.start();
		};
		
		app.connection.onerror = function(error) {
			console.log('WebSocket error', error);
			app.displayError('A WebSocket error occured!', true);
		};
		
		app.connection.onclose = function() {
			app.displayError('The connection to the server has been lost!', true);
			window.setTimeout(function() {
				app.openSocketConnection();
			}, 1000);
		};
		
		app.connection.onmessage = function(message) {
			try {
                app.messageHandler(JSON.parse(message.data));
            }
            catch(e) {
                console.log(e);
                console.log('invalid JSON WebSocket message!');
				console.log(JSON,stringify(message.data));
            }
		};
	},
	
	/**
	 * generates the navigation tabs and controls
	 * can be run again when the configuration changes
	 */
	generatePage: function() {
		var app = this,
			generateControl = function(tab, target, num, bigLabel, num2) {
				var id = target + (num2 || '') + num;
				// set intial status values
				if(typeof app.status.on[id] == 'undefined') {
					app.status.fader[id] = app.config.maxFaderValue;
					app.status.faderEffect.main.Pan[id] = app.config.maxFaderValue;
					app.status.faderName[id] = app.config.emptyName;
					
					if(target != 'auxsend' && target != 'sum') {
						app.status.on[id] = true;
						app.status.level[id] = 0;
					}
					app.status.level['sum1'] = 0;
					app.status.level['sum2'] = 0;
				}
				
				// generate HTML
				return '<div class="control"' + (target == 'sum' ? ' style="width: 100%;"' : '') + ' " data-id="' + id + '" data-target="' + target + '" data-number="' + num + '" data-number2="' + (num2 || '') + '">\
					<div class="on-button">\
						ON\
					</div>\
					<div class="group"></div>\
					<div class="pair"></div>\
					\
					<div class="pan">&nbsp;</div>\
					\
					<div class="fader">\
						<div class="fader-ticks">\
						<div class="fader-bar">\
							' + (target == 'channel' || target == 'auxsend' ? '\
							<div class="fader-background-max10"></div>\
							<div class="fader-level" style="height:100%"></div>\
							<div class="fader-db-left" style="bottom:100%">\
								<div class="fader-db-label-left">+10</div>\
							</div>\
							<div class="fader-db-left" style="bottom:90.59%">\
								<div class="fader-db-label-left">+5</div>\
							</div>\
							<div class="fader-db-left fader-db-0" style="bottom:81.18%">\
								<div class="fader-db-label-left fader-db-0">0</div>\
							</div>\
							<div class="fader-db-left" style="bottom:70.2%">\
								<div class="fader-db-label-left">-5</div>\
							</div>\
							<div class="fader-db-left" style="bottom:56.08%">\
								<div class="fader-db-label-left">-10</div>\
							</div>\
							<div class="fader-db-left" style="bottom:41.18%">\
								<div class="fader-db-label-left">-15</div>\
							</div>\
							<div class="fader-db-left" style="bottom:30.98%">\
								<div class="fader-db-label-left">-20</div>\
							</div>\
							<div class="fader-db-left" style="bottom:16.86%">\
								<div class="fader-db-label-left">-30</div>\
							</div>\
							<div class="fader-db-left fader-db-medium" style="bottom:9.02%">\
								<div class="fader-db-label-left">-40</div>\
							</div>\
							<div class="fader-db-left fader-db-big" style="bottom:4.54%">\
								<div class="fader-db-label-left fader-db-medium">-50</div>\
							</div>\
							<div class="fader-db-left" style="bottom:0%">\
								<div class="fader-db-label-left">-&infin;</div>\
							</div>\ ' : (target == 'sum' ? '\
							<div class="fader-background-max0"></div>\
							<div class="fader-level-left" style="height:100%"></div>\
							<div class="fader-level-right" style="height:100%"></div>\
							<div class="fader-db-right" style="bottom:100%">\
								<div class="fader-db-label-right">0</div>\
							</div>\
							<div class="fader-db-right" style="bottom:91.37%">\
								<div class="fader-db-label-right">-5</div>\
							</div>\
							<div class="fader-db-right" style="bottom:79.61%">\
								<div class="fader-db-label-right">-10</div>\
							</div>\
							<div class="fader-db-right" style="bottom:69.41%">\
								<div class="fader-db-label-right">-15</div>\
							</div>\
							<div class="fader-db-right" style="bottom:57.65%">\
								<div class="fader-db-label-right">-20</div>\
							</div>\
							<div class="fader-db-right" style="bottom:41.18%">\
								<div class="fader-db-label-right">-30</div>\
							</div>\
							<div class="fader-db-right" style="bottom:29.41%">\
								<div class="fader-db-label-right">-40</div>\
							</div>\
							<div class="fader-db-right" style="bottom:18.43%">\
								<div class="fader-db-label-right">-50</div>\
							</div>\
							<div class="fader-db-right fader-db-big" style="bottom:11.37%">\
								<div class="fader-db-label-right">-60</div>\
							</div>\
							<div class="fader-db-right" style="bottom:8.24%">\
								<div class="fader-db-label-right">-70</div>\
							</div>\
							<div class="fader-db-right" style="bottom:0%">\
								<div class="fader-db-label-right">-&infin;</div>\
							</div>\ ': '\
							<div class="fader-background-max0"></div>\
							<div class="fader-level" style="height:100%"></div>\
							<div class="fader-db-left" style="bottom:100%">\
								<div class="fader-db-label-left">0</div>\
							</div>\
							<div class="fader-db-left" style="bottom:91.37%">\
								<div class="fader-db-label-left">-5</div>\
							</div>\
							<div class="fader-db-left" style="bottom:79.61%">\
								<div class="fader-db-label-left">-10</div>\
							</div>\
							<div class="fader-db-left" style="bottom:69.41%">\
								<div class="fader-db-label-left">-15</div>\
							</div>\
							<div class="fader-db-left" style="bottom:57.65%">\
								<div class="fader-db-label-left">-20</div>\
							</div>\
							<div class="fader-db-left" style="bottom:41.18%">\
								<div class="fader-db-label-left">-30</div>\
							</div>\
							<div class="fader-db-left" style="bottom:29.41%">\
								<div class="fader-db-label-left">-40</div>\
							</div>\
							<div class="fader-db-left" style="bottom:18.43%">\
								<div class="fader-db-label-left">-50</div>\
							</div>\
							<div class="fader-db-left fader-db-big" style="bottom:11.37%">\
								<div class="fader-db-label-left">-60</div>\
							</div>\
							<div class="fader-db-left" style="bottom:8.24%">\
								<div class="fader-db-label-left">-70</div>\
							</div>\
							<div class="fader-db-left" style="bottom:0%">\
								<div class="fader-db-label-left">-&infin;</div>\
							</div>\ ')) + '\
						</div>\
						</div>\
						\
						<div class="fader-handle' + (target == 'sum' ? ' fader-handle-sum' : '') + '">100%</div>\
					</div>\
					\
					<div class="fader-label">&nbsp;</div>\
					<div class="fader-select" id="' + num + '" data-id="' + target + '">\
					<div class="fader-biglabel">' +
						bigLabel +
					'</div>\
					</div>\
					\
				</div>';
			},

			generateEffectControl = function(tab, target, num, bigLabel, num2) {
				var id = target + (num2 || '') + num;
				
				// set intial status values
				if(typeof app.status.on[id] == 'undefined') {
					app.status.fader[id] = app.config.maxFaderValue;
					app.status.faderEffect.main.Pan[id] = app.config.maxFaderValue;
					app.status.faderName[id] = app.config.emptyName;
					
					if(target != 'auxsend') {
						app.status.on[id] = true;
						app.status.level[id] = 0;
					}
				}
				// generate HTML
				return '<div class="control" " data-id="' + id + '" data-target="' + target + '" data-number="' + num + '" data-number2="' + (num2 || '') + '"> ' +
					(target == 'property' ? 
					'<div class="effect-label" id="effect-label">' +
						app.status.effectFader +
					'</div>' 
					: 
					'<div class="on-button">\
						ON\
					</div>') +
					(target == 'property' ? 
					'<div class="effect-label" id="effect-max"> 100 \
					</div>' 
					: 
					'<div class="group"></div>\
					<div class="pair"></div>\
					\
					<div class="pan">&nbsp;</div>') +
			
					'<div class="fader">\
						<div class="fader-ticks">\
						<div class="fader-bar">\
							' + (target == 'solo' ? '\
							<div class="fader-background-max10"></div>\
							<div class="fader-level" style="height:100%"></div>\
							<div class="fader-db-right" style="bottom:100%">\
								<div class="fader-db-label-right">+10</div>\
							</div>\
							<div class="fader-db-right" style="bottom:90.59%">\
								<div class="fader-db-label-right">+5</div>\
							</div>\
							<div class="fader-db-right fader-db-0" style="bottom:81.18%">\
								<div class="fader-db-label-right fader-db-0">0</div>\
							</div>\
							<div class="fader-db-right" style="bottom:70.2%">\
								<div class="fader-db-label-right">-5</div>\
							</div>\
							<div class="fader-db-right" style="bottom:56.08%">\
								<div class="fader-db-label-right">-10</div>\
							</div>\
							<div class="fader-db-right" style="bottom:41.18%">\
								<div class="fader-db-label-right">-15</div>\
							</div>\
							<div class="fader-db-right" style="bottom:30.98%">\
								<div class="fader-db-label-right">-20</div>\
							</div>\
							<div class="fader-db-right" style="bottom:16.86%">\
								<div class="fader-db-label-right">-30</div>\
							</div>\
							<div class="fader-db-right fader-db-medium" style="bottom:9.02%">\
								<div class="fader-db-label-right">-40</div>\
							</div>\
							<div class="fader-db-right fader-db-big" style="bottom:4.54%">\
								<div class="fader-db-label-right fader-db-medium">-50</div>\
							</div>\
							<div class="fader-db-right" style="bottom:0%">\
								<div class="fader-db-label-right">-&infin;</div>\
							</div>\ ' : '\
							<div class="fader-background-max10"></div>\
							<div class="fader-level" style="height:100%"></div>\
							<div class="fader-db-left" style="bottom:100%">\
								<div class="fader-db-label-left">+10</div>\
							</div>\
							<div class="fader-db-left" style="bottom:90.59%">\
								<div class="fader-db-label-left">+5</div>\
							</div>\
							<div class="fader-db-left fader-db-0" style="bottom:81.18%">\
								<div class="fader-db-label-left fader-db-0">0</div>\
							</div>\
							<div class="fader-db-left" style="bottom:70.2%">\
								<div class="fader-db-label-left">-5</div>\
							</div>\
							<div class="fader-db-left" style="bottom:56.08%">\
								<div class="fader-db-label-left">-10</div>\
							</div>\
							<div class="fader-db-left" style="bottom:41.18%">\
								<div class="fader-db-label-left">-15</div>\
							</div>\
							<div class="fader-db-left" style="bottom:30.98%">\
								<div class="fader-db-label-left">-20</div>\
							</div>\
							<div class="fader-db-left" style="bottom:16.86%">\
								<div class="fader-db-label-left">-30</div>\
							</div>\
							<div class="fader-db-left fader-db-medium" style="bottom:9.02%">\
								<div class="fader-db-label-left">-40</div>\
							</div>\
							<div class="fader-db-left fader-db-big" style="bottom:4.54%">\
								<div class="fader-db-label-left fader-db-medium">-50</div>\
							</div>\
							<div class="fader-db-left" style="bottom:0%">\
								<div class="fader-db-label-left">-&infin;</div>\
							</div>\ ' ) + '\
						</div>\
						</div>\
						\
						<div class="fader-handle' + (target == 'solo' ? ' fader-handle-sum' : '') + '">100%</div>\
					</div>' +
					(target == 'property' ? 
					'<div class="effect-label" id="effect-min"> 100 \
					</div>' 
					: '') +
				'</div>';
			},

			generateTab = function(id, label, title, active) {
				if(active) {
					app.status.activeTab = id;
				}
				
				return '<li data-tab="' + id + '"' + (title ? ' title="' + title + '"' : '') + ' class="autogenerated' + (active ? ' active' : '') + '">' + label + '</li>';
			},

			generateEffectTab = function(id, label, title, active) {
				if(active) {
					app.status.activeEffectTab = id;
				}
				return '<li data-vtab="' + id + '"' + (title ? ' title="' + title + '"' : '') + ' class="autogenerated' + (active ? ' active' : '') + '">' + label + '</li>';
			},

			generateEffectContent = function(id, label, tabIsActive){
				var i = 0,
					outHtml = '';

				if(tabIsActive) {
					app.status.activeEffectTab = id;
				}
				outHtml = '<div class="effect_content autogenerated" data-vtab="' + id + '"' + (tabIsActive ? ' style="display:block"' : '') + '>\
				<div class="effect_grid control-disabled" id="effect_grid">';
				for (i = 0; i < 16; i++){
					outHtml += '<div class="div' + (parseInt(i)+1) + ' effect_button" data-id="' + app.config.effectProperties[id][i] + '"> </div>'
				}
				outHtml += '</div>\
				</div>';
				return outHtml;
			},
			
			generateConfigurationInput = function(target, number) {
				id = target + number;
				if (target == 'channel') {
					label = i
				} else if (target == 'sum') {
					label = 'sum'
				} else if (target == 'aux') {
					label = 'A' + i
				} else if (target == 'bus') {
					label = 'B' + i
				}
				
                return '<p class="autogenerated"><label>' + label + '</label><input type="text" data-id="' + id + '" data-target="' + target + '" data-number="' + number + '" maxlength="16" /></p>';
            },
			
			naviHtml = '',
			contentHtml = '',
            configChannelHtml = '',
            configMasterHtml = '',

			effectNavHTML = '',
			
			tabid, i, tab, fader, tabIsActive,
			
			activeTabSelected = !!app.status.activeTab,
			firstTab = true;
		
		// remove perviously auto-generated elements if method is called multiple times
		$('.autogenerated').remove();

        // generate tabs and controls

		for(tabid in app.config.controls) {
            if(app.config.controls.hasOwnProperty(tabid)) {
                tab = app.config.controls[tabid];
                tabIsActive = activeTabSelected ? (app.status.activeTab === tabid) : firstTab;

                naviHtml += generateTab(tabid, tab.label, tab.title, tabIsActive);

                contentHtml += '<div class="tabcontent autogenerated" data-tab="' + tabid + '"' + (tabIsActive ? ' style="display:block"' : '') + '>' + '<div class="tabcontent_left">';

                for(i = 0; i < tab.faders.length-1; i++) {
                    fader = tab.faders[i];
                    contentHtml += generateControl(tabid, fader[0], fader[1], fader[2], fader[3]);
                }

                contentHtml += '</div> <div class="tabcontent_right">';
				
				fader = tab.faders[tab.faders.length-1];
                contentHtml += generateControl(tabid, fader[0], fader[1], fader[2], fader[3]);

                contentHtml += '</div> </div>';

                firstTab = false;
            }
		}

		// generate effects tab
		
		naviHtml += generateTab('effects', 'EFFECTS', 'Effects', activeTabSelected ? (app.status.activeTab === tabid) : firstTab);
		'<ul id="navi" class="hidden">\
			<li data-tab="effects autogenerated" title="Effects">EFFECTS</li>\
			</ul>';

		effectNavHTML += generateEffectTab('main', 'Main', 'Main', true);
		effectNavHTML += generateEffectTab('comp', 'Compressor', 'Compressor', false);
		effectNavHTML += generateEffectTab('eq', 'Equalizer', 'Equalizer', false);
		effectNavHTML += generateEffectTab('gate', 'Gate', 'Gate', false);
		effectNavHTML += generateEffectTab('delay', 'Delay', 'Delay', false);

		effectContentHTML = generateEffectContent('main','Main',true);
		effectContentHTML += generateEffectContent('comp','Compressor',false);
		effectContentHTML += generateEffectContent('eq','Equalizer',false);
		effectContentHTML += generateEffectContent('gate','Gate',false);
		effectContentHTML += generateEffectContent('delay','Delay',false);
		
		effectChanHTML = generateEffectControl('effects','solo',1,'SOLO');
		effectControl1HTML = generateEffectControl('effects','property',1,'PROPERTY');

		effectHeadHTML = '<div class="fader-select" id="1" data-id="channel" style="width:20% ; float: left"> &lt;  &lt; </div>\
		<div class="fader-label" style="position: absolute; top: 5px;">&nbsp;</div>\
		<div class="fader-select" id="2" data-id="channel" style="width:20% ; float: right"> &gt; &gt; </div>\
		<div class="fader-biglabel" style="position: absolute; bottom: 10px; width: calc(100% - 20px)">Channel</div>';
		
		// generate configuration inputs
		
        for(i = 1; i <= app.config.channelCount; i++) {
            configChannelHtml += generateConfigurationInput('channel', i);
        }

		configChannelHtml += generateConfigurationInput('sum', 0);

        for(i = 1; i <= app.config.auxCount; i++) {
            configMasterHtml += generateConfigurationInput('aux',i);
        }

        for(i = 1; i <= app.config.busCount; i++) {
            configMasterHtml += generateConfigurationInput('bus', i);
        }
		
		$('#navi').prepend(naviHtml).removeClass('hidden');
		$('#naviDropdownContent').prepend(naviHtml).removeClass('hidden');
		$('#content').append(contentHtml);
		$('#vnavi').append(effectNavHTML);
		$('#effect_head').html(effectHeadHTML);
		$('#effect_channel').html(effectChanHTML);
		$('#effect_control1').html(effectControl1HTML);
		$('#effect_content').html(effectContentHTML);
        $('#configuration_channels').html(configChannelHtml);
        $('#configuration_master').html(configMasterHtml);
		
		// update controls in the currently active tab
		// to display the right values when the method has been called again
		app.updateTabControls();
		
		app.bindDynamicEventHandlers();

        app.refreshConfiguration();
	},
	
	/**
	 * binds event handlers for
	 * 	fader dragging
	 *	on-buttons
	 *	tab navigation
	 *	fader height computation on window resize
	 */
	bindGlobalEventHandlers: function() {
		var app = this,
			$content = $('#content'),
			$navi = $('#navi'),
			$vnavi = $('#vnavi'),
			$naviDropdown = $('#naviDropdown');

        // add mouse fader events only when pointer events are unavailable

        if(!window.navigator.msPointerEnabled && !window.PointerEvent) {

            // fader mouse events
            $content.on('mousedown', '.fader', function(e) {
                app.eventAbstraction.faderStart(
                    $(this).parents('.control'),
                    e.pageY
                );
            });

            $content.on('mousemove', function(e) {
                var fader = false,
                    i;

                for(i in app.status.movedFaders) {
                    if(app.status.movedFaders.hasOwnProperty(i) && app.status.movedFaders[i]) {
                        fader = i;
                        break;
                    }
                }

                if(!fader) {
                    return;
                }

                app.eventAbstraction.faderMove(
                    $content.find('.control[data-id="' + fader + '"]'),
                    e.pageY
                );
            });

            $(document).on('mouseup', function() {
                app.status.movedFaders = {};
            });

        }

		// on-buttons
		$content.on('click', '.on-button', function() {
			app.eventAbstraction.onButton(
				$(this).parents('.control')
			);
		});
		
		// select-buttons
		$content.on('click', '.fader-select', function() {
			var $this = $(this);
			app.status.selectedFader = $this.attr('id');
			app.status.selectedFaderType = $this.attr('data-id');
			app.switchTab('effects', null);
		});

		// effect-buttons
		$content.on('click', '.effect_button', function() {
			var $this = $(this);
			app.eventAbstraction.onEffect($this)
		});
		
		// tab navigation
		$navi.on('click', 'li', function() {
			var $this = $(this);
			if($this.data('tab')) {
				app.switchTab($this.data('tab'), $this);
			}
			// fullscreen navigation item
			else if($this.attr('id') == 'toggle-fullscreen') {
				app.toggleFullScreen();
			}
		});

		$naviDropdown.on('click', 'li', function() {
			var $this = $(this);
			
			if($this.data('tab')) {
				app.switchTab($this.data('tab'), $this);
			}
			// fullscreen navigation item
			else if($this.attr('id') == 'toggle-fullscreen') {
				app.toggleFullScreen();
			}
		});

		// vertical tab navigation
		$vnavi.on('click', 'li', function() {
			var $this = $(this);
			if($this.data('vtab')) {
				app.switchEffectTab($this.data('vtab'), $this);
			}
		});
		
		// re-compute fader height on window resize
		$(window).on('resize', function() {
			app.switchTab(app.status.activeTab, null)
			app.refreshFaderHeight();
		});

        // configuration
        $('#configuration_save').click(function() {
            app.saveConfiguration();
        });
	},
	
	/**
	 * bind touch event handlers for dynamically generated controls
	 * - faders
	 * - on-buttons
	 */
	bindDynamicEventHandlers: function() {
		var app = this;
		
		// move faders

		[].forEach.call(document.querySelectorAll('.fader'), function(el) {
			var $control = $(el).parents('.control');

            // standard touch events
            if(!window.navigator.msPointerEnabled && !window.PointerEvent) {

                el.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    app.eventAbstraction.faderStart($control, e.targetTouches[0].pageY);
                }, false);

                el.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    app.eventAbstraction.faderMove($control, e.targetTouches[0].pageY);
                }, false);

                el.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    app.eventAbstraction.faderStop($control);
                }, false);

            }
            // MSIE pointer events
            else {
                var pointerdown = function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        // capture pointer on the element it started to ensure
                        // that the pointer
                        e.target.setPointerCapture(e.pointerId);

                        app.eventAbstraction.faderStart($control, e.clientY);
                    },
                    pointermove = function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        app.eventAbstraction.faderMove($control, e.clientY);
                    },
                    pointerup = function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        app.eventAbstraction.faderStop($control);
                    };

                if(window.PointerEvent) {
                    el.addEventListener('pointerdown', pointerdown, false);
                    el.addEventListener('pointermove', pointermove, false);
                    el.addEventListener('pointerup', pointerup, false);
                }
                else {
                    el.addEventListener('MSPointerDown', pointerdown, false);
                    el.addEventListener('MSPointerMove', pointermove, false);
                    el.addEventListener('MSPointerUp', pointerup, false);
                }

            }

		});
	},
	
	eventAbstraction: {
		
		/**
		 * touchstart/mousedown/pointerdown/MSPointerDown on fader
		 * @param $control {jQuery} .control object
		 * @param position {int} y touch/mouse position
		 */
		faderStart: function($control, position) {
			var app = remoteApp;
			
			app.status.movedFaders[$control.data('id')] = true;
			$control.data('originalPosition', $control.find('.fader-handle').position().top);
			$control.data('touchPosition', position);
		},
		
		/**
		 * touchmove/mousemove/pointermove/MSPointerMove on fader
		 * @param $control {jQuery} .control object
		 * @param position {int} y touch/mouse position
		 */
		faderMove: function($control, position) {
			var app = remoteApp,
				$handle = $control.find('.fader-handle'),
				id = $control.data('id'),
                target = $control.data('target'),
                num = $control.data('number'),
                num2 = $control.data('number2'),

                $controls = $('.control:visible'),

                pairNum, groupId, oldID, i, j;

            if(!app.status.movedFaders[id]) {
                return;
            }

			// compute and apply position
			var newPositionPx = $control.data('originalPosition')+position - $control.data('touchPosition'),
				newPositionPercent = newPositionPx/app.status.faderHeight * 100,
				newValue;

			if(newPositionPercent < 0) {
				newPositionPercent = 0;
			}
			else if(newPositionPercent > app.config.maxHandlePercent) {
				newPositionPercent = app.config.maxHandlePercent;
			}
			
			$handle.css('top', newPositionPercent + '%');	

			if (target == 'property') {
				// compute and send new value
				num = app.status.selectedFader;
				if (app.status.effectFader == 'LowQ') {
					app.status.faderEffect['eq']['HPFOn'][app.status.selectedFaderType + num] = 0
					app.sendControlMessage(
						'faderEffect',
						app.status.selectedFaderType,
						num,
						0,
						num2,
						'HPFOn',
						app.status.activeEffectTab
					);
				}
				if (app.status.effectFader == 'HiQ') {
					app.status.faderEffect['eq']['LPFOn'][app.status.selectedFaderType + num] = 0
					app.sendControlMessage(
						'faderEffect',
						app.status.selectedFaderType,
						num,
						0,
						num2,
						'LPFOn',
						app.status.activeEffectTab
					);
				}

				if (app.status.effectFader == "Knee" && app.status.activeEffectTab == 'comp' && app.status.faderEffect['comp']['Type'][app.status.selectedFaderType + num] > 1) {
					newValue = app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min1'] + Math.round(
						(1 - newPositionPercent/app.config.maxHandlePercent) * (app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['max1'] - app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min1'])
					);
				} else {
					newValue = app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min'] + Math.round(
						(1 - newPositionPercent/app.config.maxHandlePercent) * (app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['max'] - app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min'])
					);
				}
				if (app.status.effectFader == 'HiQ' && newValue > 40) { 
					newValue = 42
				}
				app.status.faderEffect[app.status.activeEffectTab][app.status.effectFader][app.status.selectedFaderType + num] = newValue;
				$handle.html(Math.round(100 - (newPositionPercent*100/app.config.maxHandlePercent)) + '%<br>' + newValue );

				app.updateEffectsData(num);

				app.sendControlMessage(
					'faderEffect',
					app.status.selectedFaderType,
					num,
					newValue,
					num2,
					app.status.effectFader,
					app.status.activeEffectTab
				);
				
			} else {
				if(target == 'solo' && app.status.selectedFader){
					target = app.status.selectedFaderType;
					id = app.status.selectedFaderType + app.status.selectedFader;
					num = app.status.selectedFader;
				} 
				// compute and send new value
				newValue = Math.round(
					(1 - newPositionPercent/app.config.maxHandlePercent) * app.config.maxFaderValue
				);
				// send only changed values
				if(Math.abs(newValue-app.status.fader[id]) < app.config.faderMoveMinValueDistance) {
					return;
				}
				app.status.fader[id] = newValue;
				$handle.html(Math.round(100 - (newPositionPercent*100/app.config.maxHandlePercent)) + '%<br>' + app.status.calcFaderDB(app.status.fader[id], target) + 'dB');

				// apply to all faders of pair
				oldID = id;
				if(target == 'auxsend') {
					id = 'channel' + num;
				}
				if((target === 'channel' || target === 'auxsend' || target === 'aux' || target === 'bus') && (app.status.faderPair && app.status.faderPair[id] == 1)) {

					pairNum = parseInt(num) + ((parseInt(num) % 2) ?  1 : (-1));
					$controls.filter('[data-target="' + target + '"][data-number="' + pairNum + '"]').find('.fader-handle').css('top', newPositionPercent + '%');
					$controls.filter('[data-target="' + target + '"][data-number="' + pairNum + '"]').find('.fader-handle').html(Math.round(100 - (newPositionPercent*100/app.config.maxHandlePercent)) + '%<br>' + app.status.calcFaderDB(app.status.fader[id], target) + 'dB');
				}
				id = oldID;

				// apply to all faders of group
				if(target === 'channel' || target === 'auxsend') {
					i = app.config.persistent.groups.length;

					while(i--) {
						if(app.config.persistent.groups[i].indexOf(num) !== -1) {
							j = app.config.persistent.groups[i].length;

							while(j--) {
								groupId = app.config.persistent.groups[i][j];

								if(groupId !== num) {
									app.status.fader[target + (num2 || '') + groupId] = newValue;
									$controls.filter('[data-target="' + target + '"][data-number="' + groupId + '"]').find('.fader-handle').css('top', newPositionPercent + '%');
									$controls.filter('[data-target="' + target + '"][data-number="' + groupId + '"]').find('.fader-handle').html(Math.round(100 - (newPositionPercent*100/app.config.maxHandlePercent))  + '%<br>' + app.status.calcFaderDB(app.status.fader[id], target) + 'dB');
								}
							}

							break;
						}
					}
				}
				app.sendControlMessage(
					'fader',
					target,
					num,
					newValue,
					num2
				);
			}
		},

        /**
         * touchstop/mouseup/pointerup/MSPointerUp
         * @param $control
         */
        faderStop: function($control) {
            remoteApp.status.movedFaders[$control.data('id')] = false;
        },
		
		/**
		 * touch/click on-button
		 * @param $control {jQuery} .control object
		 */
		onButton: function($control) {
			var app = remoteApp,
				id = $control.data('id'),
				target = $control.data('target'),
                num = parseInt($control.data('number')),
				newValue = !app.status.on[id],

                $controls = $('.control:visible'),

                i, j, groupId, pairNum = 0, newTarget;
			
			// override aux sends: toggle channel on-status
			if(target == 'auxsend' || target == 'solo') {
				num = (target == 'solo' ? app.status.selectedFader : num);
				target = (target == 'solo' ? app.status.selectedFaderType : 'channel');
				id = target + num;
				newValue = !app.status.on[id];
			}

			app.status.on[id] = newValue;
			
			if(newValue) {
				$control.removeClass('control-disabled');
			}
			else {
				$control.addClass('control-disabled');
			}

			// apply to all buttons of a pair
			if(app.status.faderPair && app.status.faderPair[id] == 1){

				if (target == 'auxsend') {
					newTarget = 'channel'
				} else {
					newTarget = target
				}
				if (num % 2){
					pairNum = parseInt(num) + 1;
				} else {
					pairNum = parseInt(num) - 1;
				}
				if(app.status.on[newTarget + num] != app.status.on[newTarget + pairNum]){
					app.status.on[newTarget + pairNum] = app.status.on[newTarget + num]
				}
				if (newTarget == 'channel') {
					if(app.status.on[target + pairNum]) {
						$controls.filter('[data-number="' + pairNum + '"]').removeClass('control-disabled');
					}
					else {
						$controls.filter('[data-number="' + pairNum + '"]').addClass('control-disabled');
					}
				} else {
					if(app.status.on[target + pairNum]) {
						$controls.filter('[data-id="' + newTarget + pairNum + '"]').removeClass('control-disabled');
					}
					else {
						$controls.filter('[data-id="' + newTarget + pairNum + '"]').addClass('control-disabled');
					}
				}
				
			}

            // apply to all buttons of group
            if(target === 'channel') {
                i = app.config.persistent.groups.length;

                while(i--) {
                    if(app.config.persistent.groups[i].indexOf(num) !== -1) {
                        j = app.config.persistent.groups[i].length;

                        while(j--) {
                            groupId = app.config.persistent.groups[i][j];

                            if(groupId !== num) {
                                app.status.on['channel' + groupId] = newValue;

                                if(newValue) {
                                    $controls.filter('[data-number="' + groupId + '"]').removeClass('control-disabled');
                                }
                                else {
                                    $controls.filter('[data-number="' + groupId + '"]').addClass('control-disabled');
                                }
                            }
                        }

                        break;
                    }
                }
            }

			app.sendControlMessage(
				'on',
				target,
				num,
				newValue
			);
		},

		onEffect: function($control) {
			var app = remoteApp,
				num = app.status.selectedFader,
				type = 'faderEffect',
				property = $control.attr('data-id'),
				effect = app.status.activeEffectTab,
				target = app.status.selectedFaderType;

			//console.log('send: effect: ' + effect + ' property: ' + property + ' num: ' + num + ' type: ' + type + ' target: ' + target)
			
			if (target == "auxsend") {
				target = "channel"
			}
			// toggle channel on-status
			if (property != '') {
				if(property == 'On'){
					newValue = !app.status.faderEffect[effect][property][target + num];
					if(newValue) {
						$control.parent().removeClass('control-disabled');
						newValue = 1;
					}
					else {
						$control.parent().addClass('control-disabled');
						newValue = 0;
					}
					app.status.faderEffect[effect][property][target + num] = newValue;	

				} else if(app.config.effectPropertiesSwitch.includes(property) ) {
					newValue = app.status.faderEffect[effect][property][target + num] + 1;
					if (newValue > app.config.propertyRange[effect][property]['max']) {
						newValue = app.config.propertyRange[effect][property]['min']
					}
					app.status.faderEffect[effect][property][target + num] = newValue;
					if (property == "LPFOn") {
						app.status.faderEffect[effect]['HiQ'][target + num] = 43;
						app.sendControlMessage(
							type,
							target,
							num,
							43,
							0,
							'HiQ',
							effect
						);
					}
					if (property == "HPFOn") {
						app.status.faderEffect[effect]['LowQ'][target + num] = 44;
						app.sendControlMessage(
							type,
							target,
							num,
							44,
							0,
							'LowQ',
							effect
						);
					}

				} else {
					app.status.effectFader = property;
					newValue = app.status.faderEffect[effect][property][target + num];
				}
				app.sendControlMessage(
					type,
					target,
					num,
					newValue,
					0,
					property,
					effect
				);

				app.updateEffectsData(app.status.selectedFader);
			}			
		}		
	},
	
	/**
	 * refreshes the height of faders when window resizes
	 * used for value computation after dragging
	 */
	refreshFaderHeight: function() {
		var app = this,
			$firstFader = $('.fader:visible').first();	
		if($firstFader.length) {
			app.status.faderHeight = $firstFader.height();
			app.config.maxHandlePercent = (app.status.faderHeight - $('.fader-handle:visible').first().height())/app.status.faderHeight*100;
		}
		else {
			// fallback when no faders are visible: compute with container height (might not work correct because the faderHeightDifference is not constant)
			app.status.faderHeight = $('#content').height()-app.config.faderHeightDifference;
			app.config.maxHandlePercent = (app.status.faderHeight - app.config.faderHandleHeight)/app.status.faderHeight*100;
		}
	},
	
	/**
	 * switches to the tab with the given id
	 * @param {String} id
	 * @param {jQuery} $this optional jQuery object of the selected tab
	 */
	switchTab: function(id, $this) {
		var app = this,
			$navi = $('#navi'),
			$tab = $this || $navi.find('li[data-tab="' + id + '"]'),
			id = $tab.data('tab');
		if(id == 'effects'){
			app.sendControlMessage('syncEffect', app.status.selectedFaderType, app.status.selectedFader, 0, 0);

			// effectFader auf erstes Property setzen, falls bisheriges Property nicht im Tab vorhanden
			if( !(app.config.effectProperties[app.status.activeEffectTab].includes(app.status.effectFader))) {
				app.status.effectFader = this.config.effectProperties[app.status.activeEffectTab][0];
			}
			if (app.status.selectedFaderType != 'channel') {
				if (app.status.activeEffectTab == 'gate') {
					app.status.activeEffectTab = 'main';
					app.status.effectFader = this.config.effectProperties[app.status.activeEffectTab][0];
					$('#vnavi').find('[data-vtab="main"]').addClass('active');
					$('.effect_content[data-vtab="main"]').show();
				} 
				$('#vnavi').find('[data-vtab="gate"]').hide();
				$('#vnavi').find('[data-vtab="gate"]').removeClass('active');
				$('.effect_content[data-vtab="gate"]').hide();	
			} else {
				$('#vnavi').find('[data-vtab="gate"]').show();
			}
			app.updateEffectsData(app.status.selectedFader);
		} else if (id == 'configuration') {
			app.updateConfigData();
		} else {
			app.updateTabControls(id, {fader: true, faderPan: true, faderName: true, faderPair: true, on: true});
		}		
		
		$('.tabcontent[data-tab="' + app.status.activeTab + '"]').hide();
		$navi.find('[data-tab="' + app.status.activeTab + '"]').removeClass('active');
		
		$('.tabcontent[data-tab="' + id + '"]').show();
		$tab.addClass('active');
		
		$("#naviDropdownButton").html((id == 'configuration') ? '<i class="icon-cog"></i>' : $navi.find('li[data-tab="' + id + '"]').text(),);

		app.status.activeTab = id;
	},

	/**
	 * switches to the effect tab with the given id
	 * @param {String} id
	 * @param {jQuery} $this optional jQuery object of the selected tab
	 */
		 switchEffectTab: function(id, $this) {
			var app = this,
				$navi = $('#vnavi'),
				$tab = $this || $navi.find('li[data-vtab="' + id + '"]'),
				id = $tab.data('vtab');	
			
			app.sendControlMessage('syncEffect', app.status.selectedFaderType, app.status.selectedFader, 0, 0);
			if (app.status.selectedFaderType != 'channel') {
				$navi.find('[data-vtab="gate"]').hide();
				$('.effect_content[data-vtab="gate"]').hide();
			}	
			$('.effect_content[data-vtab="' + app.status.activeEffectTab + '"]').hide();
			$navi.find('[data-vtab="' + app.status.activeEffectTab + '"]').removeClass('active');
			
			$('.effect_content[data-vtab="' + id + '"]').show();
			$tab.addClass('active');

			app.status.activeEffectTab = id;
			app.status.effectFader = this.config.effectProperties[id][0];
			app.updateEffectsData(app.status.selectedFader)
		},
	
	/**
	 * handles socket messages, updates application status and control displays
	 * @param {object} message
	 *		properties: type (on, fader, faderPan, faderName, faderEffect, faderPair, level), target (channel, sum, aux, bus, auxsend), num, num2, value, prop
	 */
	messageHandler: function(message) {
		var app = this,
			id = message.target ? message.target+(message.num2 || '')+message.num : false,
			controlIsVisible = false,
			
			controls, i, updateType;
		
		// update all levels with one message
		if(message.type === 'level') {

			for(i in message.levels) {
				app.status.level[(message.target + i)] = message.levels[i];
			}
			if (app.status.activeTab == 'effects'){
				app.status.level['solo1'] = app.status.level[app.status.selectedFaderType + app.status.selectedFader];
				app.updateControl('solo',1,'',{level:true});
			}
			else {
				app.updateTabControls(false, {level: true});
			}
			
		}
        // complete sync
        else if(message.type === 'sync') {
            app.status.fader = message.status.fader;
			app.status.faderName = message.status.faderName;
			app.status.faderEffect = message.status.faderEffect;
			app.status.faderPair = message.status.faderPair;
            app.status.on = message.status.on;
            app.updateTabControls(false, {fader: true, faderPan: true, faderName: true, faderPair: true, on: true});

            $('#loading-dialog').fadeOut(400);
        }
        /* configuration
        else if(message.type === 'config') {
            app.config.persistent = message.config;
            app.refreshConfiguration();
        } */
		//  faderName message
        else if(app.status[message.type] && (message.type === 'faderName' || message.type === 'busName' || message.type === 'auxName' || message.type === 'sumName')) {
			app.status[message.type][id] = message.value;
        }
		//  faderPair message
		else if(app.status[message.type] && message.type === 'faderPair') {
			app.status[message.type][id] = message.value;
        }
		//  faderEffect (target: gate, eq, comp, delay) message
		else if(app.status[message.type] && message.type === 'faderEffect') {
			app.status.faderEffect[message.target][message.prop][message.faderType + message.num] = message.value;
			if (message.num == app.status.selectedFader) {
				app.updateEffectsData(message.num);
			}
        }
		
		// update fader and on-button per channel
		else if(app.status[message.type] && app.status[message.type][id] !== message.value) {
	
			// determine if control is currently visible
			if(app.config.controls[app.status.activeTab]) {
				controls = app.config.controls[app.status.activeTab].faders;	
				for(i in controls) {
					if((controls[i][0] == message.target) &&
						(!message.num || controls[i][1] == message.num) &&
						(!message.num2 || controls[i][3] == message.num2)) {
						controlIsVisible = true;	
					}
					else if(controls[i][0] == 'auxsend' &&
							controls[i][1] == message.num) {
						controlIsVisible = true;
					}
				}
			}

			app.status[message.type][id] = message.value;

			if (app.status.activeTab == 'effects' && message.num == app.status.selectedFader) {
				updateType = {};
				updateType[message.type] = true;
				app.updateControl('solo', message.num, '', updateType);
			}
	
			if(controlIsVisible) {
				updateType = {};
				updateType[message.type] = true;
				app.updateControl(message.target, message.num, message.num2, updateType);
			}
		}
	},
	
	/**
	 * update all controls in the selected tab
	 * @param {String} tab tab-id, default currently active tab
	 * @param {object} update @see remoteApp.updateControl()
	 */
	updateTabControls: function(tab, update) {
		
		if(!tab) {
			tab = this.status.activeTab;
		}
		
		var app = this,
			$controls = $('.tabcontent[data-tab="' + tab + '"] .control');
		
		// refresh control status in new tab
		$controls.each(function() {
			app.updateControl($(this).data('target'), $(this).data('number'), $(this).data('number2'), update);
		});
	},

	updateConfigData: function() {

		var app = this,
			$controls = $('.tabcontent[data-tab="configuration"] .autogenerated');
		// refresh text input in new tab
		$controls.each(function() {
			$(this).find(':input').val(app.status.faderName[$(this).find(':input').data('id')].trim());
		});
	},

	updateEffectsData: function(num) {
		var app = this,
		id = app.status.selectedFaderType + num
		value = 0,
		property = '';

		if (app.status.selectedFaderType == "auxsend") {
			id = "channel" + num
		}
		
		app.status.on['solo1'] = app.status.on[id];
		app.status.fader['solo1'] = app.status.fader[id];
		app.status.level['solo1'] = app.status.level[id];
		app.status.faderName['solo1'] = app.status.faderName[id];
		app.status.faderEffect.main.Pan['solo1'] = app.status.faderEffect.main.Pan[id];
		app.status.faderPair['solo1'] = app.status.faderPair[id];
		app.updateControl('solo',1,'',{on:true,fader:true,faderPan:true,faderName:true,faderPair:true,level:true});

		if (app.status.selectedFaderType == 'sum') {
			lowerLimit = 0;
			upperLimit = 0;
		} else if (app.status.selectedFaderType == 'aux') {
			lowerLimit = 1;
			upperLimit = 8;
		} else if (app.status.selectedFaderType == 'bus') {
			lowerLimit = 1;
			upperLimit = 8;
		} else {
			lowerLimit = 1;
			upperLimit = this.config.channelCount;
		};
		$('.tabcontent[data-tab="effects"] .fader-biglabel').html(app.status.faderName[id]);
		$('.tabcontent[data-tab="effects"] .fader-label').html(app.status.selectedFaderType + ' ' + num);
		$('.tabcontent[data-tab="effects"] .fader-select').first().attr('id',(num > lowerLimit ? (num -1) : lowerLimit));
		$('.tabcontent[data-tab="effects"] .fader-select').first().attr('data-id',app.status.selectedFaderType);
		$('.tabcontent[data-tab="effects"] .fader-select').first().html('&lt ' + (num > lowerLimit ? (num -1) : '--') + ' &lt;');
		$('.tabcontent[data-tab="effects"] .fader-select').eq(1).attr('id',(num < upperLimit ? (1 + parseInt(num)) : upperLimit));
		$('.tabcontent[data-tab="effects"] .fader-select').eq(1).attr('data-id',app.status.selectedFaderType);
		$('.tabcontent[data-tab="effects"] .fader-select').eq(1).html('&gt; ' + (num < upperLimit ? (1 + parseInt(num)) : '--') + ' &gt;');
		$('.tabcontent[data-tab="effects"] #effect-label').html(app.status.effectFader);
		if (app.status.effectFader == "Knee" && app.status.activeEffectTab == 'comp' && app.status.faderEffect['comp']['Type'][id] > 1) {
			$('.tabcontent[data-tab="effects"] #effect-min').html('Min: ' + app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min1']);
			$('.tabcontent[data-tab="effects"] #effect-max').html('Max: ' + app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['max1']);
		} else {
			$('.tabcontent[data-tab="effects"] #effect-min').html('Min: ' + app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['min']);
			$('.tabcontent[data-tab="effects"] #effect-max').html('Max: ' + app.config.propertyRange[app.status.activeEffectTab][app.status.effectFader]['max']);
		}
		

		//app.sendControlMessage('syncEffect', app.status.selectedFaderType, num, 0, 0);

		for (i = 1; i < 21; i++){
			target = '.div' + i;
			$(target).html('');
		}

		//remove highlighting
		$('.effect_button').removeClass('effect_button_selected');
		
		for(var x in app.config.effectProperties){
			if(x == app.status.activeEffectTab) {
				for (i=0; i<16; i++){
					target = '.div' + (parseInt(i) + 1);
					property = app.config.effectProperties[x][i];
					$(target).removeClass('effect_button_selected_off')
					if(property != '') {
						if (x == 'main') {
							$('.div1').parent().removeClass('control-disabled');					
						} else {
							if(app.status.faderEffect[x]['On'][id]) {
								$(target).parent().removeClass('control-disabled');
							}
							else {
								$(target).parent().addClass('control-disabled');
							}
						}
						if ((x == 'main' && property == 'Pan') || (app.status.selectedFaderType == 'channel') || x == 'eq' || x == 'comp' || (x == 'delay' && (property == 'On' || property =='Time'))) {
							value = app.status.faderEffect[x][property][id];
							if (app.status.effectFader == property){
								//set highlight for selected property
								$(target).addClass('effect_button_selected');
								app.status.fader['property1'] = value;
								app.updateControl('property1',num,'',{fader:true});
							}
							//show values and change values to speaking names
							if(app.config.effectPropertiesSwitch.includes(property) ) {
								$(target).html(property + '<br>' + app.config.propertyRange[x][property]['label'][value]);
								if (app.config.propertyRange[x][property]['label'][value] == 'Off') {
									$(target).addClass('effect_button_selected_off')
								} else {
									$(target).removeClass('effect_button_selected_off')
								}
							} else {
								if (property == "Pan") {
									if (value == 0) {
										value = "CENTER"
									} else if (value < 0) {
										value = "L " + (value * (-1))
									} else {
										value = "R " + value
									}
								} else if (property == "Gain" && x == 'comp' && app.status.faderEffect['comp']['Type'][id] > 1) {
									value = -180 + value;
								}
								if (app.config.propertyRange[x][property]['label'][0].substring(0,5) != 'table') {
									$(target).html(property + '<br>' + value + ' ' + app.config.propertyRange[x][property]['label']);
								} else if (property == "Knee" && x == 'comp' && app.status.faderEffect['comp']['Type'][id] > 1) {
									$(target).html(property + '<br>' + (value + 1) +  ' dB' );
								} else {
									if (property == "Knee" && x == 'comp' && app.status.faderEffect['comp']['Type'][id] < 2 && value >5) {value = 5}
									$(target).html(property + '<br>' + app.config[app.config.propertyRange[x][property]['label'][0]][value]);
								}
								
							}
						}
					}
				}
			}
		}

	},
	
	/**
	 * updates a control to display its current values
	 * @param {String} target channel, channelPan, sum, aux, bus
     * @param {int} num
     * @param {int} num2
	 * @param {object} update which values shall be updated (type: true); default all
	 *		types: on, fader, level
	 */
	updateControl: function(target, num, num2, update) {
		var app = this,
			id = target + (num2 || '') + num,
			oldId = id,
			$control = $('.control[data-id="' + id + '"]'),
			$onControl = $control,
			prop = '', effect = '',
			faderPercent, levelPercent, value;

		if (app.status.activeTab == 'effects' && num == app.status.selectedFader) {
			$control = $('.control[data-id="solo1"]');
			$onControl = $control;
			if(target == 'property1') {
				prop = app.status.effectFader;
				effect = app.status.activeEffectTab;
				app.status.fader['property1'] = app.status.faderEffect[effect][prop][app.status.selectedFaderType + num];
				$control = $('.control[data-id="'+ target +'"]');
				$onControl = $control;
				id = target;

			} else{
				id = app.status.selectedFaderType + num;
				oldId = id;
			}
			target = app.status.selectedFaderType;
		}

		if(!update) {
			update = {
				on: true,
				fader: true,
				faderPan: true,
				faderName: true,
				faderPair: true,
				level: true
			};
		}
		
		// update on-button status
		if(update.on) {
			if(target == 'auxsend') {
				id = 'channel' + num;
			}
			if (app.status.activeTab != 'master') {
				$onControl = $('.control[data-number="' + num + '"]');
			}
			if(app.status.on[id]) {
				$onControl.removeClass('control-disabled');
			}
			else {
				$onControl.addClass('control-disabled');
			}
			id = oldId;
		}
		
		// update fader position if fader is not being moved
		if((update.fader || update.faderPan) && !app.status.movedFaders[id]) {
			if (prop == "Knee" && effect == 'comp' && app.status.faderEffect['comp']['Type'][target + num] > 1) {
				faderPercent = (1 - (app.status.faderEffect[effect][prop][target + num] - app.config.propertyRange[effect][prop]['min1'])/(app.config.propertyRange[effect][prop]['max1'] - app.config.propertyRange[effect][prop]['min1'])) * app.config.maxHandlePercent;
				$control.find('.fader-handle').html(Math.round(100 - (faderPercent*100/app.config.maxHandlePercent)) + '%<br>' + app.status.faderEffect[effect][prop][target + num]);
			} else if (prop != '') {
				if(prop == "Knee" && effect == 'comp' && app.status.faderEffect['comp']['Type'][target + num] < 2 && app.status.fader[id] > 5 ) {
					app.status.faderEffect[effect][prop][target + num] = 5
				};
				faderPercent = (1 - (app.status.faderEffect[effect][prop][target + num] - app.config.propertyRange[effect][prop]['min'])/(app.config.propertyRange[effect][prop]['max'] - app.config.propertyRange[effect][prop]['min'])) * app.config.maxHandlePercent;
				$control.find('.fader-handle').html(Math.round(100 - (faderPercent*100/app.config.maxHandlePercent)) + '%<br>' + app.status.faderEffect[effect][prop][target + num]);
			} else {
				faderPercent = (1 - app.status.fader[id]/app.config.maxFaderValue) * app.config.maxHandlePercent;	
				$control.find('.fader-handle').html(Math.round(100 - (faderPercent*100/app.config.maxHandlePercent)) + '%<br>' + app.status.calcFaderDB(app.status.fader[id], target) + 'dB');
			}
			$control.find('.fader-handle').css('top', faderPercent + '%');
			if(target == 'auxsend') {
				if(num2 % 2){ // odd
					tempId = target + (1 + Math.floor(num2/2)) + num;
				}else{	// even
					tempId = target + (num2/2) + num;	
				}
				value = app.status.faderEffect.main.Pan[tempId];
			}else{
				value = app.status.faderEffect.main.Pan[id];
			}
			if (value == 0) {
				value = "CENTER"
			} else if (value < 0) {
				value = "L " + (value * (-1))
			} else {
				value = "R " + value
			}
			$control.find('.pan').html(value);
		}
		
		// update fader names
		if(update.faderName) {
			if(target == 'auxsend') {
				id = 'channel' + num;
			}
			$control.find('.fader-label').html(app.status.faderName[id]);
			id = oldId;
		};

		// update pairings of channels
		var colorVar;
		if(update.faderPair && app.status.faderPair) {
			if(target == 'auxsend') {
				id = 'channel' + num;
			}
			if (app.status.faderPair[id] == 1) {
				if(Math.floor((num - 1) / 2) % 2){
					$control.find('.pair').addClass('pair-a');
				}else{
					$control.find('.pair').addClass('pair-b');
				}
				
			} else {	
				if(Math.floor((num - 1) / 2) % 2){
					$control.find('.pair').removeClass('pair-a');
				}else{
					$control.find('.pair').removeClass('pair-b');
				}			
			}
			id = oldId;
		}

		// update displayed meter level
		if(update.level) {
			// show channel level on aux sends
			if(target == 'auxsend') {
				id = 'channel' + num;
			}
			if(target == 'sum') {
					id = "sum0";
					levelPercent = (
						1 - Math.pow(app.status.level['sum1'], 2) / Math.pow(app.config.maxLevelValue,2)
					) * 100;
					$control.find('.fader-level-left').css('height', levelPercent + '%');
					levelPercent = (
						1 - Math.pow(app.status.level['sum2'], 2) / Math.pow(app.config.maxLevelValue,2)
					) * 100;
					$control.find('.fader-level-right').css('height', levelPercent + '%');
			} else {
				levelPercent = (
					1 - Math.pow(app.status.level[id], 2) / Math.pow(app.config.maxLevelValue,2)
				) * 100;
				$control.find('.fader-level').css('height', levelPercent + '%');
			}
		}	
	},

    /**
     * refresh layout based on configuration
     * - fader names
     * - groups
     * - configuration form
     */
    refreshConfiguration: function() {
        var app = remoteApp,

            $config = $('#configuration'),

            groupVal = '',

            color, i, j;


        // groups
        $('.control .group').css('background', 'transparent');

        var getGroupColor = function(num) {
            var groupColors = ['#ff0000', '#ffff00', '#00ffff', '#00ff00', '#0000ff', '#ff00ff', '#fff'];
            var rand = function() {
                return Math.round(55 + Math.random()*200);
            };

            if(typeof(groupColors[num]) !== 'undefined') {
                return groupColors[num];
            }

            return 'rgb(' + rand() + ',' + rand() + ',' + rand() + ')';
        };

        for(i = 0; i < app.config.persistent.groups.length; i++) {
            groupVal += app.config.persistent.groups[i].join(',') + '\n';

            color = getGroupColor(i);
            j = app.config.persistent.groups[i].length;

            while(j--) {
                $('.control[data-id="channel' + app.config.persistent.groups[i][j] + '"] .group').css('background', color);
                $('.control[data-target="auxsend"][data-number="' + app.config.persistent.groups[i][j] + '"] .group').css('background', color);
            }
        }
        $('#configuration_groups').val(groupVal);

        $('#configuration_loading').hide();
    },

    /**
     * parse configuration from inputs, apply it and send it to the server
     */
    saveConfiguration: function() {
        var app = remoteApp,

            newConfig = {
                names: {},
                groups: []
            },
            groups, i, j;

        // names

        $('#configuration').find('input[data-id]').each(function() {
            var val = $.trim($(this).val());

            if(val === '') {
                return;
            }

			for (i=val.length; i < 16; i++) {
				val = val + ' ';
			}

            app.status.faderName[$(this).data('id')] = val;
			app.sendControlMessage(
				'faderName',
				$(this).data('target'),
				$(this).data('number'),
				val
			);
        });

        // groups

        groups = $('#configuration_groups').val().split('\n');

        for(i = 0; i < groups.length; i++) {
            groups[i] = groups[i].replace(/[^\d,]/g, '');

            if(groups[i] !== '') {
                groups[i] = groups[i].split(',');

                j = groups[i].length;

                while(j--) {
                    groups[i][j] = parseInt(groups[i][j]);

                    if(isNaN(groups[i][j]) || groups[i][j] < 1 || groups[i][j] > app.config.channelCount) {
                        groups[i].splice(j, 1);
                    }
                }

                if(groups[i].length <= 1) {
                    continue;
                }

                newConfig.groups.push(groups[i]);
            }
        }

        app.config.persistent = newConfig;
        app.refreshConfiguration();

        app.sendMessage({
            type: 'config_save',
            config: newConfig
        });

        $('#configuration_save').html('Configuration saved.');

        window.setTimeout(function() {
            $('#configuration_save').html('Save configuration');
        }, 5000);
    },
	
	/**
	 * send WebSocket message to the server
	 * @param {object} obj
	 */
	sendMessage: function(obj) {
		if(typeof obj == 'object') {
			this.connection.send(JSON.stringify(obj));
		}
		else {
			console.log('invalid socket output message: ', obj);
		}
	},
	
	/**
	 * send message to the server
	 * @param {string} type on, fader, level, faderEffect
	 * @param {String} target channel, sum, aux, bus, 
	 * @param {int} num default 0
	 * @param {int} value default 0
	 * @param {int} num2 default 0 [used for aux send]
	 * @param {String} prop property of main, gate, comp, eq, delay 
	 * @param {String} effect main, gate, comp, eq, delay 
	 */
	sendControlMessage: function(type, target, num, value, num2, prop, effect) {
		this.sendMessage({
			type: type,
			target: target,
			num: num || 0,
			value: value || 0,
			num2: num2 || 0,
			prop: prop || 0,
			effect: effect || 0
		});
	},
	
	/**
	 * display error message
	 * @param {String} message
	 * @param {boolean} showRefreshButton
	 */
	displayError: function(message, showRefreshButton) {
		$('#error-dialog-text').html(message);
		
		if(showRefreshButton) {
			$('#error-dialog-reload').show();
		}
		else {
			$('#error-dialog-reload').hide();
		}
		
		$('#error-dialog').fadeIn(1000);
	},

	hideError: function() {
        $('#error-dialog').fadeOut(1000);
	}
	
};

remoteApp.init();

// Toggle dopdown navigation
function naviDropdown() {
	document.getElementById("naviDropdownContent").classList.toggle("show");
}
  
  // Close dropdown when clicking outside
  window.onclick = function(event) {
	if (!event.target.matches('#naviDropdownButton')) {
		if (document.getElementById("naviDropdownContent").classList.contains('show')) {
			document.getElementById("naviDropdownContent").classList.remove('show');
		}
	}
} 