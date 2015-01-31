---
---

{% assign params = site.data.params | replace: '=>', ':' %}
/*

{% comment %}
I'm not sure if throwing in a whole JSON file like this is a really good use of Liquid or a really bad one.
{% endcomment %}
*/

var Piano = function() {
    var _context;
    var _playing = {};

    var _params = {{ params }};
    var _current;

    $('input[type=checkbox]').change(function(event) {
        var data = event.target.dataset;
        if (data.filter && data.parameter) {
            _params[data.filter][data.parameter] = event.target.checked;
        }
    });


    $('input[type=range], select[data-filter]').change(function(event) {
        var data = event.target.dataset;
        _params[data.filter][data.parameter] = event.target.value;
    });

    var ranges = $('input[type=range]');
    var toggles = $('input[type=checkbox][id$="-toggle"], input[type=checkbox][id$="-input"]');
    var selects = $('select[data-filter]');
    var file = $('.btn-file :file');
    var fileLabel = $('.btn-file .filename');
    var audioError = $('#audio-error');
    $('#reset').click(function(event) {
        loadSound('sound/default.wav');
        for (var i in _playing) {
            for (var j in _playing[i]) {
                _playing[i][j].stop();
                delete _playing[i][j];
            }
        }
        _params = {{ params }};

        ranges.trigger('reset');
        toggles.trigger('reset');
        selects.trigger('reset');
        file.trigger('reset', [_params["piano"]["custom-label"]]);
    });

    $('#random').click(function(event) {
        ranges.trigger('random');
        toggles.trigger('random');
        selects.trigger('random');
    });

    $('#mutate').click(function(event) {
        ranges.trigger('mutate');
        selects.trigger('mutate');
    });

    function notCompatible(error) {
        $('#app').remove();
        $('#not-compatible').css('display', 'block');
        console.error(error);
    }

    function loadSound(path) {
        var request = new XMLHttpRequest();

        request.open('GET', path, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            _context.decodeAudioData(request.response, function(buffer) {
                _current = buffer;
            }, function(error) {
                notCompatible(error);
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
        notCompatible(e);
    }

    loadSound("sound/default.wav");

    return {
        lowerKey: function(keyElement) {
            if (!_playing[keyElement]) {
                var pitch = $(keyElement).data('pitch') || 1;
                _playing[keyElement] = playSound(_current, pitch);
            }
        },

        raiseKey: function(keyElement) {
            var key = _playing[keyElement];
            if (key) {
                for (var i in key) {
                    key[i].stop();
                }
                delete _playing[keyElement];
            }
        },

        stop: function() {
            for (var i in _playing) {
                for (var j in _playing[i]) {
                    _playing[i][j].stop();
                    delete _playing[i][j];
                }
                delete _playing[i];
            }
        },

        uploadSound: function(file) {
            var f = new FileReader();
            var text = fileLabel.text();
            f.onload = function(e) {

                _context.decodeAudioData(f.result, function(buffer) {
                    _current = buffer;
                }, function(error) {
                    console.error(error);
                    
                    audioError.modal();
                    fileLabel.text(text);
                });
            };

            if (file) {
              f.readAsArrayBuffer(file);
            }
        }
    };
}();
