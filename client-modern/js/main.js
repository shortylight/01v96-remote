(function () {
    'use strict';

    var channelCount = 32;
    var faderTicks = [
        { label: '-∞', value: 0 },
        { label: '-50', value: 11 },
        { label: '-40', value: 23 },
        { label: '-30', value: 43 },
        { label: '-20', value: 79 },
        { label: '-15', value: 105 },
        { label: '-10', value: 143 },
        { label: '-5', value: 179 },
        { label: '0', value: 207 },
        { label: '+5', value: 231 },
        { label: '+10', value: 255 }
    ];
    var channelBank = document.getElementById('channel-bank');
    var connectionStatus = document.getElementById('connection-status');
    var connectionDialog = document.getElementById('connection-dialog');
    var connectionMode = document.getElementById('connection-mode');
    var midiPort = document.getElementById('midi-port');
    var midiPortField = document.getElementById('midi-port-field');
    var connectionCurrent = document.getElementById('connection-current');
    var connectionFeedback = document.getElementById('connection-feedback');
    var nameDialog = document.getElementById('name-dialog');
    var nameForm = document.getElementById('name-form');
    var nameInput = document.getElementById('channel-name-input');
    var panDialog = document.getElementById('pan-dialog');
    var panForm = document.getElementById('pan-form');
    var panValue = document.getElementById('pan-value-input');
    var panReadout = document.getElementById('pan-dialog-value');
    var effectDialog = document.getElementById('effect-dialog');
    var effectDialogPanel = effectDialog.querySelector('.effect-dialog');
    var effectDialogTitle = document.getElementById('effect-dialog-title');
    var effectOnButton = document.getElementById('effect-on-button');
    var effectFields = document.getElementById('effect-fields');
    var selectedChannel = 0;
    var activePopupEffect = '';
    var activePopupChannel = 0;
    var connectionSelectionPending = false;
    var socket;
    var reconnectTimer;
    var lastSentFader = {};
    var state = {
        fader: {},
        on: {},
        faderName: {},
        faderPair: {},
        faderEffect: {
            main: { Pan: {} },
            gate: { On: {} },
            comp: { On: {} },
            eq: { On: {} },
            delay: { On: {} }
        }
    };
    var effectDefinitions = {
        main: [
            { name: 'Phase', choices: ['Normal', 'Inverted'] },
            { name: 'Stereo', choices: ['Off', 'On'] },
            { name: 'Direct', choices: ['Off', 'On'] },
            { name: 'FollowPan', choices: ['Off', 'On'] }
        ],
        gate: [
            { name: 'Type', choices: ['Gate', 'Ducking'] },
            { name: 'Threshold', min: -540, max: 0, unit: 'dB' },
            { name: 'Range', min: -70, max: 0, unit: 'dB' },
            { name: 'KeyIn', choices: ['Self', 'Channel', 'AUX'] },
            { name: 'Attac', min: 0, max: 120, unit: 'ms' },
            { name: 'Decay', min: 0, max: 159, table: 'table07' },
            { name: 'Hold', min: 0, max: 215, table: 'table06' },
            { name: 'KeyCh', choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
            { name: 'KeyAUX', choices: ['1', '2', '3', '4', '5', '6', '7', '8'] },
            { name: 'Link', choices: ['Off', 'On'] }
        ],
        comp: [
            { name: 'Type', choices: ['Comp', 'Expander', 'Compander H', 'Compander S'] },
            { name: 'Threshold', min: -540, max: 0, unit: '0.1 dB' },
            { name: 'Ratio', min: 0, max: 15, table: 'table08' },
            { name: 'Attac', min: 0, max: 120, unit: 'ms' },
            { name: 'Release', min: 0, max: 159, table: 'table07' },
            { name: 'Gain', min: 0, max: 180, unit: '0.1 dB' },
            { name: 'Knee', choices: ['Hard', '1', '2', '3', '4', '5'] },
            { name: 'Location', choices: ['Pre EQ', 'Post EQ', 'Post Fader'] },
            { name: 'Link', choices: ['Off', 'On'] }
        ],
        eqTop: [
            { name: 'Mode', choices: ['Type 1', 'Type 2'] },
            { name: 'Att', min: -960, max: 120, eqAttenuator: true, label: 'Attenuator' }
        ],
        eq: [
            { name: 'LowQ', min: 0, max: 40, eqQ: true },
            { name: 'LowMidQ', min: 0, max: 40, eqQ: true },
            { name: 'HiMidQ', min: 0, max: 40, eqQ: true },
            { name: 'HiQ', min: 0, max: 40, eqQ: true },
            { name: 'LowF', min: 5, max: 124, table: 'table12' },
            { name: 'LowMidF', min: 5, max: 124, table: 'table12' },
            { name: 'HiMidF', min: 5, max: 124, table: 'table12' },
            { name: 'HiF', min: 5, max: 124, table: 'table12' },
            { name: 'LowG', min: -180, max: 180, eqGain: true },
            { name: 'LowMidG', min: -180, max: 180, eqGain: true },
            { name: 'HiMidG', min: -180, max: 180, eqGain: true },
            { name: 'HiG', min: -180, max: 180, eqGain: true }
        ],
        delay: [
            { name: 'Time', min: 0, max: 43400, unit: 'samples' },
            { name: 'FBGain', min: -99, max: 99, unit: '' },
            { name: 'Mix', min: -100, max: 100, unit: '' }
        ]
    };
    var legacyTables = {
        table06: ('0.02 ms|0.04 ms|0.06 ms|0.08 ms|0.10 ms|0.13 ms|0.15 ms|0.17 ms|0.19 ms|0.21 ms|0.23 ms|0.25 ms|0.27 ms|0.29 ms|0.31 ms|0.33 ms|0.35 ms|0.38 ms|0.40 ms|0.42 ms|0.44 ms|0.46 ms|0.48 ms|0.50 ms|' +
            '0.52 ms|0.54 ms|0.56 ms|0.58 ms|0.60 ms|0.63 ms|0.65 ms|0.67 ms|0.69 ms|0.73 ms|0.77 ms|0.81 ms|0.85 ms|0.90 ms|0.94 ms|0.98 ms|1.02 ms|1.06 ms|1.10 ms|1.15 ms|1.19 ms|1.23 ms|1.27 ms|1.31 ms|' +
            '1.35 ms|1.44 ms|1.52 ms|1.60 ms|1.69 ms|1.77 ms|1.85 ms|1.94 ms|2.02 ms|2.10 ms|2.19 ms|2.27 ms|2.35 ms|2.44 ms|2.52 ms|2.60 ms|2.69 ms|2.85 ms|3.02 ms|3.19 ms|3.35 ms|3.52 ms|3.69 ms|3.85 ms|4.02 ms|4.19 ms|' +
            '4.35 ms|4.52 ms|4.69 ms|4.85 ms|5.02 ms|5.19 ms|5.35 ms|5.69 ms|6.02 ms|6.35 ms|6.69 ms|7.02 ms|7.35 ms|7.69 ms|8.02 ms|8.35 ms|8.69 ms|9.02 ms|9.35 ms|9.69 ms|10.0 ms|10.3 ms|10.6 ms|11.3 ms|' +
            '12.0 ms|12.6 ms|13.3 ms|14.0 ms|14.6 ms|15.3 ms|16.0 ms|16.6 ms|17.3 ms|18.0 ms|18.6 ms|19.3 ms|20.0 ms|20.6 ms|21.3 ms|22.6 ms|24.0 ms|25.3 ms|26.6 ms|28.0 ms|29.3 ms|30.6 ms|32.0 ms|33.3 ms|' +
            '34.6 ms|36.0 ms|37.3 ms|38.6 ms|40.0 ms|41.3 ms|42.6 ms|45.3 ms|48.0 ms|50.6 ms|53.3 ms|56.0 ms|58.6 ms|61.3 ms|64.0 ms|66.6 ms|69.3 ms|72.0 ms|74.6 ms|77.3 ms|80.0 ms|82.6 ms|85.3 ms|90.6 ms|' +
            '96.0 ms|101 ms|106 ms|112 ms|117 ms|122 ms|128 ms|133 ms|138 ms|144 ms|149 ms|154 ms|160 ms|165 ms|170 ms|181 ms|192 ms|202 ms|213 ms|224 ms|234 ms|245 ms|256 ms|266 ms|277 ms|288 ms|298 ms|309 ms|320 ms|330 ms|341 ms|362 ms|384 ms|405 ms|426 ms|448 ms|469 ms|490 ms|512 ms|533 ms|554 ms|576 ms|597 ms|618 ms|640 ms|661 ms|682 ms|725 ms|768 ms|810 ms|853 ms|896 ms|938 ms|981 ms|1.02 s|1.06 s|1.10 s|1.15 s|1.19 s|1.23 s|1.28 s|1.32 s|1.36 s|1.45 s|1.53 s|1.62 s|1.70 s|1.79 s|1.87 s|1.96 s').split('|'),
        table07: ('5 ms|11 ms|16 ms|21 ms|27 ms|32 ms|37 ms|43 ms|48 ms|53 ms|59 ms|64 ms|69 ms|75 ms|80 ms|85 ms|91 ms|96 ms|101 ms|107 ms|112 ms|117 ms|123 ms|128 ms|133 ms|139 ms|144 ms|149 ms|155 ms|160 ms|165 ms|171 ms|' +
            '176 ms|187 ms|197 ms|208 ms|219 ms|229 ms|240 ms|251 ms|261 ms|272 ms|283 ms|293 ms|304 ms|315 ms|325 ms|336 ms|347 ms|368 ms|389 ms|411 ms|432 ms|453 ms|475 ms|496 ms|517 ms|539 ms|560 ms|581 ms|603 ms|624 ms|645 ms|667 ms|688 ms|' +
            '730 ms|773 ms|816 ms|858 ms|901 ms|944 ms|986 ms|1.02 s|1.07 s|1.11 s|1.15 s|1.20 s|1.24 s|1.28 s|1.32 s|1.37 s|1.45 s|1.54 s|1.62 s|1.71 s|1.79 s|1.88 s|1.96 s|2.05 s|2.13 s|2.22 s|2.30 s|2.39 s|2.47 s|2.56 s|2.65 s|' +
            '2.73 s|2.90 s|3.07 s|3.24 s|3.41 s|3.58 s|3.75 s|3.93 s|4.10 s|4.27 s|4.44 s|4.61 s|4.78 s|4.95 s|5.12 s|5.29 s|5.46 s|5.80 s|6.14 s|6.48 s|6.83 s|7.17 s|7.51 s|7.85 s|8.19 s|8.53 s|8.87 s|9.21 s|9.56 s|9.90 s|10.2 s|10.5 s|10.9 s|11.6 s|12.2 s|12.9 s|13.6 s|14.3 s|15.0 s|15.7 s|16.3 s|17.0 s|17.7 s|18.4 s|19.1 s|19.7 s|20.4 s|21.1 s|21.8 s|23.2 s|24.5 s|25.9 s|27.3 s|28.6 s|30.0 s|31.4 s|32.7 s|34.1 s|35.4 s|36.8 s|38.2 s|39.5 s|40.9 s|42.3 s').split('|'),
        table08: ['1 : 1', '1.1 : 1', '1.3 : 1', '1.5 : 1', '1.7 : 1', '2 : 1', '2.5 : 1', '3 : 1', '3.5 : 1', '4 : 1', '5 : 1', '6 : 1', '8 : 1', '10 : 1', '20 : 1', '∞ : 1'],
        table11: ('10.0|9.0|8.0|7.0|6.3|5.6|5.0|4.5|4.0|3.5|3.2|2.8|2.5|2.2|2.0|1.8|1.6|1.4|1.2|1.1|1.0|0.90|0.80|0.70|0.63|0.56|0.50|0.45|0.40|0.35|0.32|0.28|0.25|0.22|0.20|0.18|0.16|0.14|0.12|0.11|0.10|Low Shelving|High Shelving|LPF|HPF').split('|'),
        table12: ('16.0Hz|17.0Hz|18.0Hz|19.0Hz|20.0Hz|21.2Hz|22.4Hz|23.6Hz|25.0Hz|26.5Hz|28.0Hz|30.0Hz|31.5Hz|33.5Hz|35.5Hz|37.5Hz|40.0Hz|42.5Hz|45.0Hz|47.5Hz|50.0Hz|53.0Hz|56.0Hz|60.0Hz|63.0Hz|67.0Hz|71.0Hz|75.0Hz|80.0Hz|85.0Hz|90.0Hz|95.0Hz|100Hz|106Hz|112Hz|118Hz|125Hz|132Hz|140Hz|150Hz|160Hz|170Hz|180Hz|190Hz|200Hz|212Hz|224Hz|236Hz|250Hz|265Hz|280Hz|300Hz|315Hz|335Hz|355Hz|375Hz|400Hz|425Hz|450Hz|475Hz|500Hz|530Hz|560Hz|600Hz|630Hz|670Hz|710Hz|750Hz|800Hz|850Hz|900Hz|950Hz|1.00kHz|1.06kHz|1.12kHz|1.18kHz|1.25kHz|1.32kHz|1.40kHz|1.50kHz|1.60kHz|1.70kHz|1.80kHz|1.90kHz|2.00kHz|2.12kHz|2.24kHz|2.36kHz|2.50kHz|2.65kHz|2.80kHz|3.00kHz|3.15kHz|3.35kHz|3.55kHz|3.75kHz|4.00kHz|4.25kHz|4.50kHz|4.75kHz|5.00kHz|5.30kHz|5.60kHz|6.00kHz|6.30kHz|6.70kHz|7.10kHz|7.50kHz|8.00kHz|8.50kHz|9.00kHz|9.50kHz|10.0kHz|10.6kHz|11.2kHz|11.8kHz|12.5kHz|13.2kHz|14.0kHz|15.0kHz|16.0kHz|17.0kHz|18.0kHz|19.0kHz|20.0kHz|21.2kHz|22.4kHz|23.6kHz').split('|')
    };
    var eqQMemory = {};

    function element(tagName, className, text) {
        var node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function send(message) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    function channelKey(channel) {
        return 'channel' + channel;
    }

    function pairedChannel(channel) {
        channel = Number(channel);
        var partner = channel % 2 ? channel + 1 : channel - 1;
        if (
            Number(state.faderPair[channelKey(channel)]) !== 1 &&
            Number(state.faderPair[channelKey(partner)]) !== 1
        ) return 0;
        return partner <= channelCount ? partner : 0;
    }

    function updatePairedFader(channel, value) {
        var partner = pairedChannel(channel);
        if (!partner) return;
        state.fader[channelKey(partner)] = value;
        updateFader(partner, value);
    }

    function updatePairedOn(channel, value) {
        var partner = pairedChannel(channel);
        if (!partner) return;
        state.on[channelKey(partner)] = value;
        updateOn(partner, value);
    }

    function updateConnection(label, className) {
        connectionStatus.textContent = label;
        connectionStatus.className = 'connection-status' + (className ? ' ' + className : '');
    }

    function updateConnectionInfo(message) {
        var labels = {
            midi: 'MIDI console',
            dummy: 'Test mixer',
            serialport: 'Serial MIDI'
        };
        var modes = message.modes || ['midi', 'dummy'];
        var ports = message.ports || [];
        var currentMode = message.mode || 'midi';
        var option;

        while (connectionMode.firstChild) connectionMode.removeChild(connectionMode.firstChild);
        modes.forEach(function (mode) {
            option = element('option', '', labels[mode] || mode);
            option.value = mode;
            connectionMode.appendChild(option);
        });
        connectionMode.value = currentMode;

        while (midiPort.firstChild) midiPort.removeChild(midiPort.firstChild);
        ports.forEach(function (portName) {
            option = element('option', '', portName);
            option.value = portName;
            midiPort.appendChild(option);
        });
        if (message.portName && ports.indexOf(message.portName) !== -1) {
            midiPort.value = message.portName;
        }
        midiPortField.hidden = currentMode !== 'midi';
        connectionCurrent.textContent = message.connected ?
            'Active: ' + (labels[currentMode] || currentMode) +
                (message.portName ? ' · ' + message.portName : '') :
            'Not connected: ' + (labels[currentMode] || currentMode);
        connectionFeedback.textContent = message.error ||
            (currentMode === 'midi' && ports.length === 0 ? 'No matching 01V96 MIDI input/output pair detected.' : '');
        connectionFeedback.className = 'connection-feedback' + (message.error ? ' is-error' : '');
        if (connectionSelectionPending) {
            connectionSelectionPending = false;
            if (message.connected && !message.error) connectionDialog.hidden = true;
        }
    }

    function panLabel(value) {
        if (value === 0) return 'C';
        return value < 0 ? 'L' + Math.abs(value) : 'R' + value;
    }

    function updatePanIndicator(channel, value) {
        var strip = document.getElementById('channel-' + channel);
        var indicator = strip.querySelector('.pan-indicator');
        var position = ((value + 63) / 126) * 100;
        indicator.style.left = position + '%';
        strip.querySelector('.pan-trigger').setAttribute('aria-label', 'Pan ' + panLabel(value) + ', open pan control');
    }

    function setPan(channel, value) {
        var normalizedValue = Math.max(-63, Math.min(63, Number(value)));
        var key = channelKey(channel);
        state.faderEffect.main.Pan[key] = normalizedValue;
        updatePanIndicator(channel, normalizedValue);
        send({
            type: 'faderEffect',
            target: 'channel',
            num: channel,
            value: normalizedValue,
            prop: 'Pan',
            effect: 'main'
        });
        send({ type: 'syncPan', num: channel });
    }

    function parameterValue(effect, parameter, channel) {
        var values = state.faderEffect[effect] && state.faderEffect[effect][parameter];
        return values && values[channelKey(channel)] !== undefined ? Number(values[channelKey(channel)]) : 0;
    }

    function parameterDisplay(definition, value) {
        if (definition.choices) return definition.choices[value] || String(value);
        if (definition.eqGain) return (value / 10).toFixed(1) + ' dB';
        if (definition.eqAttenuator) return (value / 10).toFixed(1) + ' dB';
        if (definition.eqQ) return legacyTables.table11[value] || 'Code ' + value;
        if (definition.table) {
            return legacyTables[definition.table][value] || 'Code ' + value;
        }
        return definition.unit ? value + ' ' + definition.unit : String(value);
    }

    function eqQKey(parameter, channel) {
        return parameter + '-' + channelKey(channel);
    }

    function rememberEqQ(parameter, channel, value) {
        var max = parameter === 'LowQ' ? 41 : parameter === 'HiQ' ? 42 : 40;
        if (value >= 0 && value <= max) eqQMemory[eqQKey(parameter, channel)] = value;
    }

    function rememberedEqQ(parameter, channel) {
        var key = eqQKey(parameter, channel);
        if (eqQMemory[key] === undefined) {
            var currentValue = parameterValue('eq', parameter, channel);
            var shelfValue = parameter === 'LowQ' ? 41 : parameter === 'HiQ' ? 42 : -1;
            if (currentValue <= 40 || currentValue === shelfValue) {
                rememberEqQ(parameter, channel, currentValue);
            } else {
                eqQMemory[key] = 0;
            }
        }
        return eqQMemory[key] === undefined ? 0 : eqQMemory[key];
    }

    function rememberChannelEqQ(channel) {
        ['LowQ', 'LowMidQ', 'HiMidQ', 'HiQ'].forEach(function (parameter) {
            rememberEqQ(parameter, channel, parameterValue('eq', parameter, channel));
        });
    }

    function effectParameterDefinition(effect, definition, channel) {
        if (effect === 'comp' && definition.name === 'Knee' && parameterValue('comp', 'Type', channel) > 1) {
            return { name: 'Knee', min: 0, max: 89, unit: 'dB' };
        }
        return Object.assign({}, definition);
    }

    function addModeSwitch(options, selectedValue, ariaLabel, onSelect, className) {
        var group = element('div', 'mode-switch' + (className ? ' ' + className : ''));
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', ariaLabel);
        options.forEach(function (option, index) {
            var button = element('button', 'mode-switch-option', option.label);
            button.type = 'button';
            button.dataset.value = option.value;
            button.setAttribute('aria-pressed', String(option.value === selectedValue));
            button.addEventListener('click', function () {
                onSelect(option.value);
            });
            group.appendChild(button);
        });
        return group;
    }

    function updateEffectParameterControl(effect, parameter, channel) {
        if (effect !== activePopupEffect || channel !== activePopupChannel) return;
        var field = effectFields.querySelector('[data-parameter="' + parameter + '"]');
        if (!field) return;
        var value = parameterValue(effect, parameter, channel);
        if (field.classList.contains('eq-filter-button')) {
            field.classList.toggle('is-active', !!value);
            field.setAttribute('aria-pressed', String(!!value));
            field.setAttribute('aria-checked', String(!!value));
            return;
        }
        if (field.classList.contains('bus-routing-button')) {
            field.classList.toggle('is-active', !!value);
            field.setAttribute('aria-pressed', value ? 'true' : 'false');
            return;
        }
        var definition = field._definition;
        if (definition.eqQ) {
            var rememberedValue = rememberedEqQ(parameter, channel);
            var filterOn = parameter === 'LowQ' ?
                !!parameterValue('eq', 'HPFOn', channel) :
                parameter === 'HiQ' ? !!parameterValue('eq', 'LPFOn', channel) : false;
            var qSlider = field.querySelector('.eq-q-slider');
            var qOutput = field.querySelector('output');
            var shelfValue = parameter === 'LowQ' ? 41 : 42;
            var qModeValue = value === 43 || value === 44 ? rememberedValue : value;
            var isShelf = qModeValue === shelfValue;
            if (qSlider && document.activeElement !== qSlider) qSlider.value = isShelf ? 41 : qModeValue;
            if (qSlider) qSlider.disabled = filterOn;
            if (qOutput) qOutput.textContent = isShelf ?
                (parameter === 'LowQ' ? 'Low Shelving' : 'High Shelving') :
                parameterDisplay(definition, qModeValue);
            field.classList.toggle('is-disabled', filterOn);
            return;
        }
        if (definition.choices) {
            value = Math.max(0, Math.min(definition.choices.length - 1, value));
        } else {
            value = Math.max(definition.min, Math.min(definition.max, value));
        }
        var modeSwitch = field.querySelector('.mode-switch');
        if (modeSwitch) {
            modeSwitch.querySelectorAll('button').forEach(function (button) {
                button.setAttribute('aria-pressed', String(Number(button.dataset.value) === value));
            });
            return;
        }
        var control = field.querySelector('input, select, button');
        var output = field.querySelector('output');
        if (control && control.getAttribute('role') === 'switch') {
            control.textContent = value ? 'ON' : 'OFF';
            control.setAttribute('aria-checked', value ? 'true' : 'false');
            control.classList.toggle('is-active', !!value);
        } else if (control && document.activeElement !== control) control.value = value;
        if (output) output.textContent = parameterDisplay(definition, value);
    }

    function addEqQParameter(definition, band, channel, container) {
        definition = effectParameterDefinition('eq', definition, channel);
        var filterName = band === 'low' ? 'HPFOn' : band === 'high' ? 'LPFOn' : '';
        var filterOn = filterName ? !!parameterValue('eq', filterName, channel) : false;
        var currentValue = parameterValue('eq', definition.name, channel);
        var shelfValue = band === 'low' ? 41 : band === 'high' ? 42 : -1;
        var savedValue = rememberedEqQ(definition.name, channel);
        var shapeValue = currentValue === 43 || currentValue === 44 ? savedValue : currentValue;
        var isShelf = shapeValue === shelfValue;
        var field = element('div', 'effect-field eq-parameter-cell');
        field.dataset.parameter = definition.name;
        field._definition = definition;
        field.appendChild(element('label', 'effect-field-label', 'Q'));
        var output = element('output', 'effect-field-value', isShelf ?
            (band === 'low' ? 'Low Shelving' : 'High Shelving') :
            parameterDisplay(definition, shapeValue));
        field.appendChild(output);
        var slider = element('input', 'effect-field-range eq-q-slider');
        slider.type = 'range';
        slider.min = '0';
        slider.max = shelfValue === -1 ? '40' : '41';
        slider.step = '1';
        slider.value = isShelf ? '41' : (shapeValue <= 40 ? shapeValue : 0);
        slider.disabled = filterOn;
        slider.setAttribute('aria-label', band === 'low' || band === 'high' ?
            band + ' band Q and shelf' : band + ' band Q');
        slider.addEventListener('input', function () {
            var sliderValue = Number(slider.value);
            var value = sliderValue === 41 ? shelfValue : sliderValue;
            if (sliderValue < 41) rememberEqQ(definition.name, channel, value);
            output.textContent = sliderValue === 41 ?
                (band === 'low' ? 'Low Shelving' : 'High Shelving') :
                parameterDisplay(definition, value);
            sendEffectParameter(channel, 'eq', definition.name, value);
        });
        field.appendChild(slider);
        field.classList.toggle('is-disabled', filterOn);
        container.appendChild(field);
    }

    function addEqFilterButton(parameter, channel, label) {
        var active = !!parameterValue('eq', parameter, channel);
        var button = element('button', 'eq-filter-button', label);
        button.type = 'button';
        button.dataset.parameter = parameter;
        button.setAttribute('role', 'switch');
        button.setAttribute('aria-checked', String(active));
        button.classList.toggle('is-active', active);
        button.addEventListener('click', function () {
            sendEffectParameter(channel, 'eq', parameter,
                parameterValue('eq', parameter, channel) ? 0 : 1);
        });
        return button;
    }

    function sendEffectParameter(channel, effect, parameter, value) {
        if (!state.faderEffect[effect]) state.faderEffect[effect] = {};
        if (!state.faderEffect[effect][parameter]) state.faderEffect[effect][parameter] = {};
        var values = state.faderEffect[effect][parameter];
        values[channelKey(channel)] = value;
        if (effect === 'eq' && /Q$/.test(parameter)) rememberEqQ(parameter, channel, value);
        send({
            type: 'faderEffect',
            target: 'channel',
            num: channel,
            value: value,
            prop: parameter,
            effect: effect
        });
        updateEffectParameterControl(effect, parameter, channel);
        if (parameter === 'On') {
            updateEffect(channel, effect);
            if (effect === activePopupEffect && channel === activePopupChannel) updateEffectOnButton();
        }
        if (effect === 'gate' && parameter === 'KeyIn' && effect === activePopupEffect && channel === activePopupChannel) {
            renderEffectFields();
        } else if (effect === 'comp' && parameter === 'Type' && effect === activePopupEffect && channel === activePopupChannel) {
            renderEffectFields();
        }

        if (effect === 'eq' && (parameter === 'LPFOn' || parameter === 'HPFOn')) {
            var qParameter = parameter === 'LPFOn' ? 'HiQ' : 'LowQ';
            var qValue = value ?
                (parameter === 'LPFOn' ? 43 : 44) :
                rememberedEqQ(qParameter, channel);
            sendEffectParameter(channel, effect, qParameter, qValue);
            if (effect === activePopupEffect && channel === activePopupChannel) renderEffectFields();
        } else if (effect === 'comp' && parameter === 'Type' && value < 2 && parameterValue('comp', 'Knee', channel) > 5) {
            sendEffectParameter(channel, effect, 'Knee', 5);
        }
    }

    function updateEffectOnButton() {
        if (!activePopupEffect || activePopupEffect === 'main') return;
        var isOn = !!parameterValue(activePopupEffect, 'On', activePopupChannel);
        effectOnButton.textContent = isOn ? 'ON' : 'OFF';
        effectOnButton.classList.toggle('is-active', isOn);
        effectOnButton.setAttribute('aria-checked', isOn ? 'true' : 'false');
    }

    function addEffectParameter(definition, effect, channel, container) {
        container = container || effectFields;
        definition = effectParameterDefinition(effect, definition, channel);
        var currentValue = parameterValue(effect, definition.name, channel);
        if (definition.choices) {
            currentValue = Math.max(0, Math.min(definition.choices.length - 1, currentValue));
        } else {
            currentValue = Math.max(definition.min, Math.min(definition.max, currentValue));
        }
        var field = element('div', 'effect-field');
        field.dataset.parameter = definition.name;
        field._definition = definition;
        if (definition.className) field.classList.add(definition.className);
        var label = element('label', 'effect-field-label', definition.label || definition.name);
        label.htmlFor = 'effect-' + definition.name;
        var output = definition.choices ? null :
            element('output', 'effect-field-value', parameterDisplay(definition, currentValue));
        var control;

        if (definition.choices && definition.choices.length === 2 &&
            definition.choices[0] === 'Off' && definition.choices[1] === 'On') {
            control = element('button', 'effect-switch');
            control.type = 'button';
            control.setAttribute('role', 'switch');
            control.setAttribute('aria-checked', currentValue ? 'true' : 'false');
            control.textContent = currentValue ? 'ON' : 'OFF';
            control.classList.toggle('is-active', !!currentValue);
            control.addEventListener('click', function () {
                var next = parameterValue(effect, definition.name, channel) ? 0 : 1;
                sendEffectParameter(channel, effect, definition.name, next);
            });
            field.classList.add('effect-field-switch');
        } else if (definition.choices) {
            if (definition.choices.length <= 3) {
                control = addModeSwitch(definition.choices.map(function (choice, index) {
                    return { label: choice, value: index };
                }), currentValue, definition.label || definition.name, function (value) {
                    sendEffectParameter(channel, effect, definition.name, value);
                });
            } else {
                control = element('select', 'effect-field-select');
                definition.choices.forEach(function (choice, value) {
                    var option = element('option', '', choice);
                    option.value = value;
                    control.appendChild(option);
                });
                control.value = currentValue;
                control.addEventListener('change', function () {
                    sendEffectParameter(channel, effect, definition.name, Number(control.value));
                });
            }
        } else {
            control = element('input', 'effect-field-range');
            control.type = 'range';
            control.min = definition.min;
            control.max = definition.max;
            control.step = '1';
            control.value = Math.max(definition.min, Math.min(definition.max, currentValue));
            control.addEventListener('input', function () {
                var value = Number(control.value);
                output.textContent = parameterDisplay(definition, value);
                sendEffectParameter(channel, effect, definition.name, value);
            });
        }

        if (definition.disabled) {
            control.disabled = true;
            field.classList.add('is-disabled');
        }
        control.id = 'effect-' + definition.name;
        field.appendChild(label);
        if (output) field.appendChild(output);
        field.appendChild(control);
        container.appendChild(field);
    }

    function openEffectPopup(effect, channel) {
        activePopupEffect = effect;
        activePopupChannel = channel;
        nameDialog.hidden = true;
        panDialog.hidden = true;
        effectDialogTitle.textContent = (effect === 'main' ? 'Channel config' : effect.toUpperCase()) + ' · CH ' + channel;
        effectDialogPanel.classList.toggle('is-config', effect === 'main');
        effectOnButton.hidden = effect === 'main';
        renderEffectFields();
        updateEffectOnButton();
        effectDialog.hidden = false;
    }

    function renderEffectFields() {
        effectFields.textContent = '';
        if (activePopupEffect === 'main') {
            effectDefinitions.main.forEach(function (definition) {
                addEffectParameter(definition, 'main', activePopupChannel);
            });
            var busRouting = element('section', 'bus-routing');
            busRouting.appendChild(element('h3', 'bus-routing-title', 'Bus routing'));
            var busButtons = element('div', 'bus-routing-buttons');
            for (var bus = 1; bus <= 8; bus++) {
                var busName = 'Bus' + bus;
                var button = element('button', 'bus-routing-button', String(bus));
                var value = parameterValue('main', busName, activePopupChannel);
                button.type = 'button';
                button.dataset.parameter = busName;
                button.setAttribute('aria-label', 'Bus ' + bus);
                button.setAttribute('aria-pressed', value ? 'true' : 'false');
                button.classList.toggle('is-active', !!value);
                button.addEventListener('click', (function (parameter, busButton) {
                    return function () {
                        var next = parameterValue('main', parameter, activePopupChannel) ? 0 : 1;
                        sendEffectParameter(activePopupChannel, 'main', parameter, next);
                        busButton.classList.toggle('is-active', !!next);
                        busButton.setAttribute('aria-pressed', next ? 'true' : 'false');
                    };
                }(busName, button)));
                busButtons.appendChild(button);
            }
            busRouting.appendChild(busButtons);
            effectFields.appendChild(busRouting);
        } else if (activePopupEffect === 'gate') {
            var gateType = Object.assign({}, effectDefinitions.gate[0], { className: 'gate-type' });
            addEffectParameter(gateType, 'gate', activePopupChannel);
            var gateLayout = element('div', 'gate-layout');
            var gateSettings = element('div', 'gate-settings');
            var gateKey = element('div', 'gate-key-controls');
            gateKey.appendChild(element('h3', 'gate-key-title', 'Key source'));
            var keyIn = parameterValue('gate', 'KeyIn', activePopupChannel);
            var keySourceSwitch = addModeSwitch(effectDefinitions.gate.filter(function (definition) {
                return definition.name === 'KeyIn';
            })[0].choices.map(function (choice, index) {
                return { label: choice, value: index };
            }), keyIn, 'Gate key source', function (value) {
                sendEffectParameter(activePopupChannel, 'gate', 'KeyIn', value);
            }, 'gate-key-switch');
            gateKey.appendChild(keySourceSwitch);
            var gateKeyFields = element('div', 'gate-key-fields');
            if (keyIn === 1) {
                var channelKeyDefinition = Object.assign({}, effectDefinitions.gate.filter(function (definition) {
                    return definition.name === 'KeyCh';
                })[0], { label: 'Channel' });
                addEffectParameter(channelKeyDefinition, 'gate', activePopupChannel, gateKeyFields);
                gateKey.appendChild(gateKeyFields);
            } else if (keyIn === 2) {
                var auxKeyDefinition = Object.assign({}, effectDefinitions.gate.filter(function (definition) {
                    return definition.name === 'KeyAUX';
                })[0], { label: 'Aux' });
                addEffectParameter(auxKeyDefinition, 'gate', activePopupChannel, gateKeyFields);
                gateKey.appendChild(gateKeyFields);
            }
            effectDefinitions.gate.slice(1).forEach(function (definition) {
                if (['KeyIn', 'KeyCh', 'KeyAUX'].indexOf(definition.name) === -1) {
                    addEffectParameter(definition, 'gate', activePopupChannel, gateSettings);
                }
            });
            gateLayout.appendChild(gateSettings);
            gateLayout.appendChild(gateKey);
            effectFields.appendChild(gateLayout);
        } else if (activePopupEffect === 'eq') {
            var eqTopRow = element('div', 'eq-mode-row');
            effectDefinitions.eqTop.forEach(function (definition) {
                addEffectParameter(definition, 'eq', activePopupChannel, eqTopRow);
            });
            effectFields.appendChild(eqTopRow);
            var eqGrid = element('div', 'eq-grid');
            var bands = [
                { title: 'Low', name: 'low', q: 'LowQ', frequency: 'LowF', gain: 'LowG' },
                { title: 'Low-mid', name: 'low-mid', q: 'LowMidQ', frequency: 'LowMidF', gain: 'LowMidG' },
                { title: 'High-mid', name: 'high-mid', q: 'HiMidQ', frequency: 'HiMidF', gain: 'HiMidG' },
                { title: 'High', name: 'high', q: 'HiQ', frequency: 'HiF', gain: 'HiG' }
            ];
            bands.forEach(function (band) {
                var header = element('div', 'eq-band-header');
                header.appendChild(element('h3', 'eq-band-heading', band.title));
                if (band.name === 'low') {
                    header.appendChild(addEqFilterButton('HPFOn', activePopupChannel, 'HPF'));
                } else if (band.name === 'high') {
                    header.appendChild(addEqFilterButton('LPFOn', activePopupChannel, 'LPF'));
                }
                eqGrid.appendChild(header);
            });
            [
                { label: 'Q', property: 'q' },
                { label: 'Frequency', property: 'frequency' },
                { label: 'Gain', property: 'gain' }
            ].forEach(function (row) {
                bands.forEach(function (band) {
                    var definition = effectDefinitions.eq.filter(function (item) {
                        return item.name === band[row.property];
                    })[0];
                    definition = Object.assign({}, definition, {
                        label: row.label,
                        className: 'eq-parameter-cell'
                    });
                    if (row.property === 'q') {
                        addEqQParameter(definition, band.name, activePopupChannel, eqGrid);
                    } else {
                        if (band.name === 'low' && row.property === 'gain' &&
                            parameterValue('eq', 'HPFOn', activePopupChannel)) definition.disabled = true;
                        if (band.name === 'high' && row.property === 'gain' &&
                            parameterValue('eq', 'LPFOn', activePopupChannel)) definition.disabled = true;
                        addEffectParameter(definition, 'eq', activePopupChannel, eqGrid);
                    }
                });
            });
            effectFields.appendChild(eqGrid);
        } else {
            (effectDefinitions[activePopupEffect] || []).forEach(function (definition) {
                addEffectParameter(definition, activePopupEffect, activePopupChannel);
            });
        }
    }

    function updatePan(channel, value) {
        updatePanIndicator(channel, Number(value) || 0);
    }

    function updateFader(channel, value) {
        var strip = document.getElementById('channel-' + channel);
        lastSentFader[channelKey(channel)] = Number(value);
        if (strip) {
            strip.querySelector('.fader-range').value = value;
            updateFaderHandle(channel, value);
        }
    }

    function updateFaderHandle(channel, value) {
        var strip = document.getElementById('channel-' + channel);
        if (!strip) return;
        var track = strip.querySelector('.fader-track');
        var thumbWidth = 34;
        var travel = Math.max(0, track.clientHeight - thumbWidth);
        track.querySelector('.fader-handle-centerline').style.bottom =
            (thumbWidth / 2 + travel * Number(value) / 255) + 'px';
    }

    function sendFaderValue(channel, value, force) {
        var key = channelKey(channel);
        var previous = lastSentFader[key];
        state.fader[key] = value;
        updatePairedFader(channel, value);
        if (previous === undefined || Math.abs(value - previous) >= 3 || value === 0 || value === 255) {
            if (value !== previous) {
                send({ type: 'fader', target: 'channel', num: channel, value: value });
                lastSentFader[key] = value;
            }
        } else if (force && value !== previous) {
            send({ type: 'fader', target: 'channel', num: channel, value: value });
            lastSentFader[key] = value;
        }
    }

    function updateOn(channel, value) {
        var strip = document.getElementById('channel-' + channel);
        if (!strip) return;
        var button = strip.querySelector('.on-button');
        button.classList.toggle('is-active', !!value);
        button.setAttribute('aria-pressed', value ? 'true' : 'false');
    }

    function updateName(channel, value) {
        var strip = document.getElementById('channel-' + channel);
        if (!strip) return;
        var nameButton = strip.querySelector('.channel-name');
        var displayName = value.trim() || 'CH' + channel;
        nameButton.textContent = displayName;
        nameButton.setAttribute('aria-label', 'Edit channel name ' + displayName);
    }

    function updateEffect(channel, effect) {
        var strip = document.getElementById('channel-' + channel);
        if (!strip) return;
        var value = parameterValue(effect, 'On', channel);
        var button = strip.querySelector('[data-effect="' + effect + '"]');
        if (button) {
            button.classList.toggle('is-active', !!value);
            button.setAttribute('aria-pressed', value ? 'true' : 'false');
        }
        if (effect === activePopupEffect && channel === activePopupChannel) updateEffectOnButton();
    }

    function addButton(strip, label, className, action, effect) {
        var button = element('button', 'strip-button ' + className, label);
        button.type = 'button';
        button.setAttribute('aria-label', label);
        if (effect) {
            button.dataset.effect = effect;
            button.setAttribute('aria-pressed', 'false');
        }
        button.addEventListener('click', function () {
            action(button);
        });
        strip.appendChild(button);
        return button;
    }

    function makeChannelStrip(channel) {
        var key = channelKey(channel);
        var strip = element('section', 'channel-strip');
        strip.id = 'channel-' + channel;
        strip.setAttribute('aria-label', 'Channel ' + channel);

        addButton(strip, 'CONFIG', 'config-button', function () {
            openEffectPopup('main', channel);
        });

        [
            { label: 'GATE', effect: 'gate' },
            { label: 'COMP', effect: 'comp' },
            { label: 'EQ', effect: 'eq' },
            { label: 'DELAY', effect: 'delay' }
        ].forEach(function (entry) {
            addButton(strip, entry.label, 'effect-button', function () {
                openEffectPopup(entry.effect, channel);
            }, entry.effect);
        });

        var panControl = element('button', 'pan-trigger');
        panControl.type = 'button';
        panControl.setAttribute('aria-label', 'Pan center, open pan control');
        panControl.setAttribute('aria-haspopup', 'dialog');
        var panTrack = element('span', 'pan-indicator-track');
        panTrack.setAttribute('aria-hidden', 'true');
        panTrack.appendChild(element('span', 'pan-center-mark'));
        panTrack.appendChild(element('span', 'pan-indicator'));
        panControl.appendChild(panTrack);
        panControl.addEventListener('click', function () {
            selectedChannel = channel;
            panValue.value = state.faderEffect.main.Pan[key] || 0;
            panReadout.textContent = panLabel(Number(panValue.value));
            effectDialog.hidden = true;
            nameDialog.hidden = true;
            panDialog.hidden = false;
            panValue.focus();
        });
        strip.appendChild(panControl);

        addButton(strip, 'ON', 'on-button', function (button) {
            var next = !state.on[key];
            state.on[key] = next;
            updateOn(channel, next);
            updatePairedOn(channel, next);
            send({ type: 'on', target: 'channel', num: channel, value: next });
            button.blur();
        });

        var faderArea = element('div', 'fader-area');
        var faderTrack = element('div', 'fader-track');
        faderTrack.appendChild(element('div', 'fader-rail'));
        var faderRange = element('input', 'fader-range');
        var faderCenterline = element('div', 'fader-handle-centerline');
        faderCenterline.setAttribute('aria-hidden', 'true');
        faderRange.type = 'range';
        faderRange.min = '0';
        faderRange.max = '255';
        faderRange.step = '1';
        faderRange.value = '0';
        faderRange.setAttribute('aria-label', 'Channel ' + channel + ' fader');
        faderRange.addEventListener('input', function () {
            var value = Number(faderRange.value);
            updateFaderHandle(channel, value);
            sendFaderValue(channel, value, false);
        });
        faderRange.addEventListener('change', function () {
            var value = Number(faderRange.value);
            updateFaderHandle(channel, value);
            sendFaderValue(channel, value, true);
        });
        faderTrack.appendChild(faderRange);
        faderTrack.appendChild(faderCenterline);
        faderTicks.forEach(function (tick) {
            var mark = element('div', 'fader-tick');
            mark.dataset.value = tick.value;
            mark.appendChild(element('span', '', tick.label));
            faderTrack.appendChild(mark);
        });
        faderArea.appendChild(faderTrack);
        strip.appendChild(faderArea);
        var channelName = element('button', 'channel-name', 'CH' + channel);
        channelName.type = 'button';
        channelName.setAttribute('aria-label', 'Edit channel name CH' + channel);
        channelName.addEventListener('click', function () {
            selectedChannel = channel;
            nameInput.value = state.faderName[key] || 'CH' + channel;
            effectDialog.hidden = true;
            panDialog.hidden = true;
            nameDialog.hidden = false;
            nameInput.focus();
            nameInput.select();
        });
        strip.appendChild(channelName);
        return strip;
    }

    function renderChannels() {
        var fragment = document.createDocumentFragment();
        var channel;
        for (channel = 1; channel <= channelCount; channel++) {
            fragment.appendChild(makeChannelStrip(channel));
        }
        channelBank.appendChild(fragment);
    }

    function fitFaders() {
        var tracks = document.querySelectorAll('.fader-track');
        var i;
        for (i = 0; i < tracks.length; i++) {
            var range = tracks[i].querySelector('.fader-range');
            var height = tracks[i].clientHeight;
            var thumbWidth = 34;
            var travel = Math.max(0, height - thumbWidth);
            range.style.width = Math.max(80, height) + 'px';
            var value = Number(range.value);
            var centerline = tracks[i].querySelector('.fader-handle-centerline');
            centerline.style.bottom = (thumbWidth / 2 + travel * value / 255) + 'px';
            var ticks = tracks[i].querySelectorAll('.fader-tick');
            for (var j = 0; j < ticks.length; j++) {
                var fraction = Number(ticks[j].dataset.value) / 255;
                ticks[j].style.bottom = (thumbWidth / 2 + travel * fraction) + 'px';
            }
        }
    }

    function handleMessage(message) {
        var key;
        var effect;
        if (message.type === 'sync' && message.status) {
            state.fader = message.status.fader || {};
            state.on = message.status.on || {};
            state.faderName = message.status.faderName || {};
            state.faderPair = message.status.faderPair || {};
            state.faderEffect = message.status.faderEffect || state.faderEffect;
            for (var channel = 1; channel <= channelCount; channel++) {
                key = channelKey(channel);
                rememberChannelEqQ(channel);
                updateFader(channel, Number(state.fader[key]) || 0);
                updateOn(channel, state.on[key]);
                updateName(channel, state.faderName[key] || 'CH' + channel);
                updatePan(channel, Number(state.faderEffect.main.Pan[key]) || 0);
                ['gate', 'comp', 'eq', 'delay'].forEach(function (name) {
                    updateEffect(channel, name);
                });
            }
            updateConnection('Connected', 'is-connected');
        } else if (message.type === 'fader' && message.target === 'channel') {
            state.fader[channelKey(message.num)] = message.value;
            updateFader(message.num, message.value);
            updatePairedFader(message.num, message.value);
        } else if (message.type === 'on' && message.target === 'channel') {
            state.on[channelKey(message.num)] = message.value;
            updateOn(message.num, message.value);
            updatePairedOn(message.num, message.value);
        } else if (message.type === 'faderPair' && message.target === 'channel') {
            state.faderPair[channelKey(message.num)] = message.value;
        } else if (message.type === 'faderName' && message.target === 'channel') {
            state.faderName[channelKey(message.num)] = message.value;
            updateName(message.num, message.value);
        } else if (message.type === 'faderEffect' && message.faderType === 'channel') {
            key = channelKey(message.num);
            effect = message.target;
            if (!state.faderEffect[effect]) state.faderEffect[effect] = {};
            if (!state.faderEffect[effect][message.prop]) state.faderEffect[effect][message.prop] = {};
            state.faderEffect[effect][message.prop][key] = message.value;
            if (effect === 'main' && message.prop === 'Pan') {
                updatePan(message.num, Number(message.value) || 0);
            } else if (message.prop === 'On') {
                updateEffect(message.num, effect);
                if (effect === activePopupEffect && message.num === activePopupChannel) updateEffectOnButton();
            }
            if (effect === 'eq' && /Q$/.test(message.prop)) {
                rememberEqQ(message.prop, message.num, Number(message.value));
            }
            updateEffectParameterControl(effect, message.prop, message.num);
            if (effect === 'eq' && (message.prop === 'HPFOn' || message.prop === 'LPFOn') &&
                effect === activePopupEffect && message.num === activePopupChannel) {
                renderEffectFields();
            }
            if (effect === 'gate' && message.prop === 'KeyIn' &&
                effect === activePopupEffect && message.num === activePopupChannel) {
                renderEffectFields();
            }
            if (effect === 'comp' && message.prop === 'Type' && effect === activePopupEffect && message.num === activePopupChannel) {
                renderEffectFields();
            }
        } else if (message.type === 'level') {
            return;
        } else if (message.type === 'connection') {
            updateConnectionInfo(message);
        }
    }

    function connect() {
        var scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(scheme + '//' + window.location.hostname + ':1338');
        socket.onopen = function () {
            window.clearTimeout(reconnectTimer);
            updateConnection('Syncing…', '');
            send({ type: 'connection_info' });
            send({ type: 'sync' });
        };
        socket.onmessage = function (event) {
            var message;
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                updateConnection('Invalid server message', 'is-error');
                window.console.error('Unable to read mixer server message', error);
                return;
            }
            handleMessage(message);
        };
        socket.onerror = function () {
            updateConnection('Connection error', 'is-error');
        };
        socket.onclose = function () {
            updateConnection('Disconnected · reconnecting', 'is-error');
            window.clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(connect, 1500);
        };
    }

    document.getElementById('connection-open-button').addEventListener('click', function () {
        connectionDialog.hidden = false;
        connectionFeedback.textContent = '';
        send({ type: 'connection_info' });
    });

    document.getElementById('connection-cancel-button').addEventListener('click', function () {
        connectionSelectionPending = false;
        connectionDialog.hidden = true;
    });

    connectionDialog.addEventListener('click', function (event) {
        if (event.target === connectionDialog) {
            connectionSelectionPending = false;
            connectionDialog.hidden = true;
        }
    });

    connectionMode.addEventListener('change', function () {
        midiPortField.hidden = connectionMode.value !== 'midi';
    });

    document.getElementById('connection-form').addEventListener('submit', function (event) {
        event.preventDefault();
        var request = {
            type: 'connection_select',
            mode: connectionMode.value
        };
        if (request.mode === 'midi') request.portName = midiPort.value;
        connectionFeedback.textContent = 'Changing mixer connection…';
        connectionFeedback.className = 'connection-feedback';
        connectionSelectionPending = true;
        send(request);
    });

    nameForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!selectedChannel) return;
        var name = nameInput.value.trim().slice(0, 8);
        var key = channelKey(selectedChannel);
        var channelName = name || 'CH' + selectedChannel;
        state.faderName[key] = channelName;
        updateName(selectedChannel, state.faderName[key]);
        send({
            type: 'faderName',
            target: 'channel',
            num: selectedChannel,
            value: channelName
        });
        nameDialog.hidden = true;
    });

    nameForm.querySelector('.dialog-cancel').addEventListener('click', function () {
        nameDialog.hidden = true;
    });

    nameDialog.addEventListener('click', function (event) {
        if (event.target === nameDialog) nameDialog.hidden = true;
    });

    panValue.addEventListener('input', function () {
        panReadout.textContent = panLabel(Number(panValue.value));
    });

    document.getElementById('pan-center-button').addEventListener('click', function () {
        panValue.value = '0';
        panReadout.textContent = 'C';
    });

    document.getElementById('pan-cancel-button').addEventListener('click', function () {
        panDialog.hidden = true;
    });

    panDialog.addEventListener('click', function (event) {
        if (event.target === panDialog) panDialog.hidden = true;
    });

    panForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (selectedChannel) setPan(selectedChannel, Number(panValue.value));
        panDialog.hidden = true;
    });

    effectOnButton.addEventListener('click', function () {
        var next = parameterValue(activePopupEffect, 'On', activePopupChannel) ? 0 : 1;
        sendEffectParameter(activePopupChannel, activePopupEffect, 'On', next);
    });

    document.getElementById('effect-close-button').addEventListener('click', function () {
        effectDialog.hidden = true;
    });

    effectDialog.addEventListener('click', function (event) {
        if (event.target === effectDialog) effectDialog.hidden = true;
    });

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !connectionDialog.hidden) {
            connectionSelectionPending = false;
            connectionDialog.hidden = true;
        }
        if (event.key === 'Escape' && !nameDialog.hidden) nameDialog.hidden = true;
        if (event.key === 'Escape' && !panDialog.hidden) panDialog.hidden = true;
        if (event.key === 'Escape' && !effectDialog.hidden) effectDialog.hidden = true;
    });

    renderChannels();
    fitFaders();
    window.addEventListener('resize', fitFaders);
    window.addEventListener('orientationchange', fitFaders);
    window.requestAnimationFrame(fitFaders);
    connect();
}());
