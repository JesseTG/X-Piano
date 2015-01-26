$(document).ready(function() {
    // When all content is loaded...

    var MUTATE_FACTOR = 10;
    var MUTATE_ODDS = 0.5;

    $(document).on('change', '.btn-file :file', function() {
        // When the "Choose File" button is clicked...
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        input.trigger('fileselect', [numFiles, label]);
        // Trigger the recently-added fileselect event
    });

    $('label[for$="-input"] input[type=checkbox]').change(function(event) {
        // When any label that describes a sound parameter is toggled...
        var parent = event.target.parentElement,
            control = parent.control;

        control.disabled = !control.disabled;
        // ...then lock or unlock the control in question

        $(parent).children('.glyphicon').toggle(0);
        // And make the lock disappear or reappear, too
    });

    var ranges = $('input[type=range]');
    ranges.on('reset', function(event) {
        var target = event.target;
        if (!target.disabled) {
            // If the user didn't lock this parameter...
            target.value = target.defaultValue;
        }
    });
    ranges.on('random', function(event) {
        var target = event.target;
        if (!target.disabled) {
            // If the user didn't lock this parameter...
            var min = Number.parseFloat(target.min);
            var max = Number.parseFloat(target.max);
            target.valueAsNumber = Math.random() * (max - min) + min;
            $(target).change();
        }
    });
    ranges.on('mutate', function(event) {
        var target = event.target;
        if (!target.disabled) {
            var step = Number.parseFloat(target.step);
            var min = Number.parseFloat(target.min);
            var max = Number.parseFloat(target.max);

            target.valueAsNumber += (MUTATE_FACTOR * step * (Math.random() < MUTATE_ODDS ? -1.0 : 1.0));
            target.valueAsNumber = Math.max(target.valueAsNumber, min);
            target.valueAsNumber = Math.min(target.valueAsNumber, max);

            $(target).change();
        }
    });

    var toggles = $('input[type=checkbox][id$="-toggle"], input[type=checkbox][id$="-input"]');
    toggles.on('reset', function(event) {
        var target = event.target;
        target.checked = target.defaultChecked;
        $(target.parentElement).toggleClass('active', target.checked);
    });
    toggles.on('random', function(event) {
        var target = event.target;
        target.checked = (Math.random() < 0.5);
        $(target.parentElement).toggleClass('active', target.checked);
        $(target).change();
    });

    var selects = $('select[data-filter]');
    selects.on('reset', function(event) {
        var target = event.target;
        if (!target.disabled) {
            // If the user didn't lock this parameter...
            target.selectedIndex = 0;
        }
    });
    selects.on('random', function(event) {
        var target = event.target;
        if (!target.disabled) {
            target.selectedIndex = Math.floor(Math.random() * target.length);
            $(target).change();
        }
    });
    selects.on('mutate', function(event) {
        var target = event.target;
        if (!target.disabled) {
            target.selectedIndex = Math.abs((target.selectedIndex += (Math.random() < .5 ? 1 : -1)) % target.length);
            $(target).change();
        }
    });

    var file = $('.btn-file :file');
    var fileLabel = $('.btn-file .filename');
    file.on('fileselect', function(event, numFiles, label) {
        // Assign an event to asking for a file.
        if (label) {
            // If the user selected a file to use...
            fileLabel.text(label);
        }
    });
    file.on('reset', function(event, defaultText) {
        fileLabel.text(defaultText);
    });

    var piano = $('#piano');
    var keys = $('#white-keys use, #black-keys use');
    var down = function(event) {
        Piano.lowerKey(event.target);
    };
    keys.mousedown(down);

    var up = function(event) {
        Piano.raiseKey(event.target);
    };
    keys.mouseup(up);
    
    $(document).mouseleave(Piano.stop);
    $(document).blur(Piano.stop);

    var keyMappings = {};
    keys.each(function(i, element) {
        var key = element.dataset.key.charCodeAt(0);
        keyMappings[key] = element;
    });


    $(document).keydown(function(event) {
        var char = event.which;
        if (char in keyMappings) {
            var pianoKey = keyMappings[char];
            Piano.lowerKey(pianoKey);
        }
    });

    $(document).keyup(function(event) {
        var char = event.which;
        if (char in keyMappings) {
            var pianoKey = keyMappings[char];
            Piano.raiseKey(pianoKey);
        }
    });
});
