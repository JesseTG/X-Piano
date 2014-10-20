var Piano = function() {
    var _context;
    var _playing = {};
    var _defaults = {
        beat: "none",
        loop: {
            enabled: true
        },
        convolve: {
            enabled: false,
            normalize: true
        },
        compress: {
            threshold: -24,
            knee: 30,
            ratio: 12,
            enabled: false,
            reduction: 0,
            attack: .003
        },
        mix_tone: {
            enabled: false,
            frequency: 8.8,
            type: "sine",
            detune: 0
        },
        biquad: {
            enabled: false,
            type: "lowpass",
            biquad: 8.5,
            q: 0,
            gain: 0,
            detune: 0
        },
        volume: {
            piano: 1,
            beat: 1
        }
    };

    // Cloning objects in JavaScript is a bitch.
    var _params = {
        beat: "none",
        loop: {
            enabled: true
        },
        convolve: {
            enabled: false,
            normalize: true
        },
        compress: {
            threshold: -24,
            knee: 30,
            ratio: 12,
            enabled: false,
            reduction: 0,
            attack: .003
        },
        mix_tone: {
            enabled: false,
            frequency: 8.8,
            type: "sine",
            detune: 0
        },
        biquad: {
            enabled: false,
            type: "lowpass",
            biquad: 8.5,
            q: 0,
            gain: 0,
            detune: 0
        },
        volume: {
            piano: 1,
            beat: 1
        }
    };
    var _current;

    var _beats = {};


    $('input[type=checkbox]').change(function(event) {
        var data = event.target.dataset;
        _params[data.filter][data.parameter] = event.target.checked;
    });

    $('input[type=range], select[data-filter]').change(function(event) {
        var data = event.target.dataset;
        _params[data.filter][data.parameter] = event.target.value;
    });

    $('#reset').click(function(event) {
        loadSound('sound/default.wav');

        for (var i in _params) {
            for (var j in _params[i]) {
                _params[i][j] = _defaults[i][j];

            }
        }

        for (var i in _playing) {
            for (var j in _playing[i]) {
                _playing[i][j].stop();
                delete _playing[i][j];
            }
        }
    });


    function loadSound(path) {
        var request = new XMLHttpRequest();

        request.open('GET', path, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            _context.decodeAudioData(request.response, function(buffer) {
                _current = buffer;
            }, function(error) {
                alert(error);
            });
        }
        request.send();
    }

    function playSound(current, pitch, delay) {
        if (!delay) {
            delay = 0;
        }

        var source = _context.createBufferSource();
        var gain = _context.createGain();

        var nodes = [source];
        var sources = [source];

        source.playbackRate.value = pitch;
        source.buffer = current;
        source.loop = _params.loop.enabled;

        gain.gain.value = _params.volume.piano;

        function enableBiquad() {
            if (_params.biquad.enabled) {
                var biquad = _context.createBiquadFilter();

                biquad.type = _params.biquad.type;
                biquad.frequency.value = Math.pow(2, _params.biquad.frequency);
                biquad.Q.value = Math.pow(10, _params.biquad.q);
                biquad.gain.value = _params.biquad.gain;
                biquad.detune.value = _params.biquad.detune;

                nodes.push(biquad);
            }
        }

        function enableMixTone() {
            if (_params.mix_tone.enabled) {
                var oscillator = _context.createOscillator();
                var merger = _context.createChannelMerger();

                oscillator.frequency.value = Math.pow(2, _params.mix_tone.frequency);
                oscillator.type = _params.mix_tone.type;
                oscillator.detune.value = _params.mix_tone.detune;

                oscillator.connect(merger);
                nodes.push(merger);
                sources.push(oscillator);
            }
        }

        function enableConvolve() {
            if (_params.convolve.enabled) {
                var convolve = _context.createConvolver();

                convolve.normalize = _params.convolve.normalize;
                convolve.buffer = _current;

                nodes.push(convolve);
            }
        }

        function enableCompress() {
            if (_params.compress.enabled) {
                var compress = _context.createDynamicsCompressor();
                compress.threshold.value = _params.compress.threshold;
                compress.knee.value = _params.compress.knee;
                compress.ratio.value = _params.compress.ratio;
                compress.reduction.value = _params.compress.reduction;
                compress.attack.value = _params.compress.attack;
                compress.release.value = _params.compress.release;

                nodes.push(compress);
            }
        }

        enableBiquad();
        enableMixTone();
        enableConvolve();
        enableCompress();

        nodes.push(gain);
        nodes.push(_context.destination);

        for (var i = 0; i < nodes.length - 1; ++i) {
            nodes[i].connect(nodes[i + 1]);
        }

        for (var s in sources) {
            sources[s].start(delay);
        }
        return sources;
    }

    try {
        _context = new(window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        alert(e + "\nThis browser doesn't support WebAudio.  Use a newer browser like Chrome or Firefox.");
    }

    //loadSound("sound/kick.mp3"); // https://www.freesound.org/people/TicTacShutUp/sounds/428/
    //loadSound("sound/snare.mp3"); // https://www.freesound.org/people/TicTacShutUp/sounds/439/
    loadSound("sound/default.wav");

    return {
        lowerKey: function(keyElement) {
            var attribs = keyElement.attributes;
            var pitch = keyElement.hasAttribute('pitch') ? Number.parseFloat(attribs['pitch'].value) : 1;

            _playing[keyElement] = playSound(_current, pitch);
        },

        raiseKey: function(keyElement) {
            var key = _playing[keyElement];
            if (key) {
                for (var i in key) {
                    key[i].stop();
                    delete key[i];
                }
                delete key;
            }
        },

        stop: function() {
            for (var i in _playing) {
                for (var j in _playing[i]) {
                    _playing[i][j].stop();
                    delete _playing[i][j];
                }

            }
        },

        uploadSound: function(file) {
            var f = new FileReader();
            f.onload = function(e) {
                _context.decodeAudioData(f.result, function(buffer) {
                    _current = buffer;
                }, function(error) {
                    alert(error);
                });
            };

            f.readAsArrayBuffer(file);
        },

        playBeat: function(beat) {
            // "beat1" or "beat2" for a beat, "none" or null to turn off
            _params.beat = beat;

            if (beat && beat != 'none') {
                var b = _beats[beat];
                b();
            }
        }
    };
}();
