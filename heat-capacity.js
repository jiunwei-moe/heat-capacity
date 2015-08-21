// heat-capacity.js

(function() {

  // Constants
  var Constants = {
    ENERGY_STEP: 500, // in J
    MASS_STEP: 0.1, //in kg
    ROOM_TEMP: 25.0, // in degrees Celsius
    FINAL_TEMP: 80.0, // in degrees Celsius
    MIN_N: 1,
    MAX_N: 4,
    EPSILON: 0.005,
  };

  // Materials
  var Materials = {
    BRICK: {
      c: 840,
      form: 'block',
      name: 'Brick',
      sprites: new Array(4),
    },
    CHOCOLATE: {
      c: 1600,
      form: 'block',
      name: 'Chocolate',
      sprites: new Array(4),
      sprites_liquid: new Array(4),
    },
    CONCRETE: {
      c: 880,
      form: 'block',
      name: 'Concrete',
      sprites: new Array(4),
    },
    COPPER: {
      c: 385,
      form: 'block',
      name: 'Copper',
      sprites: new Array(4),
    },
    CUPRONICKEL: {
      c: 390,
      form: 'coin',
      name: 'Cupronickel',
      sprites: new Array(4),
    },
    GLASS: {
      c: 840,
      form: 'block',
      name: 'Glass',
      sprites: new Array(4),
    },
    GOLD: {
      c: 129,
      form: 'coin',
      name: 'Gold',
      sprites: new Array(4),
    },
    IRON: {
      c: 450,
      form: 'block',
      name: 'Iron',
      sprites: new Array(4),
    },
    SAND: {
      c: 835,
      form: 'container',
      name: 'Sand',
      sprites: new Array(4),
    },
    SOIL: {
      c: 800,
      form: 'container',
      name: 'Soil',
      sprites: new Array(4),
    },
    WATER: {
      c: 4181.3,
      form: 'container',
      name: 'Water',
      sprites: new Array(4),
    },
    WOOD: {
      c: 1700,
      form: 'block',
      name: 'Wood',
      sprites: new Array(4),
    },
  };

  var Environment = {
    material: Materials.BRICK,
    temperature: Constants.ROOM_TEMP,
    temperature_final: Constants.FINAL_TEMP,
    n: Constants.MIN_N,
    recording: false,
    results: [],
    curent_result: null,
    interval: null,
    time: 0,
  }

  function useExponent_replacer(match, p1, p2, p3) {
    return p1 + ' &times; 10<sup>' + parseInt(p3) + '</sup>';
  }

  function useExponent(s) {
    if (s.toUpperCase().indexOf('E') > -1) {
      s = s.replace(/([-+]?[0-9]*\.?[0-9]+)([eE]([-+]?[0-9]+))?/, useExponent_replacer);
    }
    return s;
  }

  function formatResult(index, result) {
    var html = '<tr><td>' + index + '</td>';
    for (var i = 0; i < result.length; i++) {
      html += '<td>' + (result[i].toPrecision ? useExponent(result[i].toPrecision(3)) : result[i]) + '</td>';
    }
    return html + '</tr>'
  }

  function handleTick() {
    Environment.temperature += Constants.ENERGY_STEP / (Environment.n * Constants.MASS_STEP) / Environment.material.c;
    Environment.time++;
    if (Environment.temperature >= Environment.temperature_final) {
      Environment.temperature = Environment.temperature_final;
      clearInterval(Environment.interval);
      Environment.interval = null;
      if (callback) callback();
    }
    refresh();
  }

  function refresh() {
    $('#mass').html((Environment.n * Constants.MASS_STEP).toPrecision(3) + ' kg');

    $('#material-menu').prop('disabled', Environment.recording);
    $('#mass-add').prop('disabled', Environment.recording || (Environment.n == Constants.MAX_N));
    $('#mass-remove').prop('disabled', Environment.recording || (Environment.n == Constants.MIN_N));

    if (Environment.n > 0) {
      $('#temperature').html(Environment.temperature.toPrecision(3) + ' &deg;C');
    } else {
      Environment.temperature = Constants.ROOM_TEMP;
      $('#temperature').html('N/A');
    }

    $('#temperature-reset').prop('disabled', Environment.recording || (Environment.n == 0));
    $('#energy-add').prop('disabled', Environment.n == 0);
    $('#energy-remove').prop('disabled', Environment.n == 0);

    if (Environment.recording) {
      $('#recording-start').addClass('hidden');
      $('#recording-stop').removeClass('hidden');
    } else {
      $('#recording-start').removeClass('hidden');
      $('#recording-stop').addClass('hidden');
    }

    $('#recording-start').prop('disabled', Environment.n < 1);

    $('#time').html(Environment.time + ' s');
    $('#energy').html(Math.round((Environment.temperature - Constants.ROOM_TEMP) * Environment.n * Constants.MASS_STEP * Environment.material.c) + ' J');

    canvas.clear();
    canvas.add(arrow_up);
    arrow_up.set('opacity', Environment.interval ? 1 : 0);
    canvas.add(arrow_down);
    arrow_down.set('opacity', 0);
    canvas.add(jar_back);
    if (Environment.n > 0) {
      switch (Environment.material.form) {
        case 'block':
        // Intentional fall-through
        case 'coin':
          for (var i = 0; i < Environment.n; i++) {
            canvas.add(Environment.material.sprites[i]);
          }
          break;
        case 'container':
          canvas.add(Environment.material.sprites[Environment.n-1]);
          break;
        }
    }
    canvas.add(jar_front);

    if (Environment.results.length == 0) {
      $('#results > tbody').html('<tr><td colspan="9">No results recorded yet.</td></tr>');
    } else {
      var html = '';
      for(var i = 0; i < Environment.results.length; i++) {
        html += formatResult(i + 1, Environment.results[i]);
      } 
      $('#results > tbody').html(html);
    }

    /* var value = temperatureSlider.slider('getValue');
    value[0] = Environment.temperature;
    value[1] = Environment.temperature_final; */
    temperatureSlider.slider('setValue', Environment.temperature);
  }

  // The canvas object that serves as the view.
  var canvas = new fabric.StaticCanvas("canvas");

  var arrow_up, arrow_down;
  var jar_back, jar_front;

  var temperatureSlider;

  var callback = null;

  $(window).on('load', function() {

    arrow_down = new fabric.Image(document.getElementById('arrow-down'), { left: 40, top: 300 }).scale(0.5);
    arrow_up = new fabric.Image(document.getElementById('arrow-up'), { left: 40, top: 300 }).scale(0.5);
    jar_back = new fabric.Image(document.getElementById('jar-back')).scale(0.5);
    jar_front = new fabric.Image(document.getElementById('jar-front'), { top: 48 }).scale(0.5);
    Materials.BRICK.sprites[0] = new fabric.Image(document.getElementById('brick'), { left: 25, top: 230 }).scale(0.5);
    Materials.BRICK.sprites[1] = new fabric.Image(document.getElementById('brick'), { left: 25, top: 200 }).scale(0.5);
    Materials.BRICK.sprites[2] = new fabric.Image(document.getElementById('brick'), { left: 25, top: 170 }).scale(0.5);
    Materials.BRICK.sprites[3] = new fabric.Image(document.getElementById('brick'), { left: 25, top: 140 }).scale(0.5);
    Materials.CHOCOLATE.sprites[0] = new fabric.Image(document.getElementById('chocolate'), { left: 25, top: 230 }).scale(0.5);
    Materials.CHOCOLATE.sprites[1] = new fabric.Image(document.getElementById('chocolate'), { left: 25, top: 200 }).scale(0.5);
    Materials.CHOCOLATE.sprites[2] = new fabric.Image(document.getElementById('chocolate'), { left: 25, top: 170 }).scale(0.5);
    Materials.CHOCOLATE.sprites[3] = new fabric.Image(document.getElementById('chocolate'), { left: 25, top: 140 }).scale(0.5);
    Materials.CHOCOLATE.sprites_liquid[0] = new fabric.Image(document.getElementById('chocolate-liquid-1'), { top: 214 }).scale(0.5);
    Materials.CHOCOLATE.sprites_liquid[1] = new fabric.Image(document.getElementById('chocolate-liquid-2'), { top: 182 }).scale(0.5);
    Materials.CHOCOLATE.sprites_liquid[2] = new fabric.Image(document.getElementById('chocolate-liquid-3'), { top: 152 }).scale(0.5);
    Materials.CHOCOLATE.sprites_liquid[3] = new fabric.Image(document.getElementById('chocolate-liquid-4'), { top: 122 }).scale(0.5);
    Materials.CONCRETE.sprites[0] = new fabric.Image(document.getElementById('concrete'), { left: 25, top: 230 }).scale(0.5);
    Materials.CONCRETE.sprites[1] = new fabric.Image(document.getElementById('concrete'), { left: 25, top: 200 }).scale(0.5);
    Materials.CONCRETE.sprites[2] = new fabric.Image(document.getElementById('concrete'), { left: 25, top: 170 }).scale(0.5);
    Materials.CONCRETE.sprites[3] = new fabric.Image(document.getElementById('concrete'), { left: 25, top: 140 }).scale(0.5);
    Materials.WATER.sprites[0] = new fabric.Image(document.getElementById('water-1'), { top: 214 }).scale(0.5);
    Materials.WATER.sprites[1] = new fabric.Image(document.getElementById('water-2'), { top: 182 }).scale(0.5);
    Materials.WATER.sprites[2] = new fabric.Image(document.getElementById('water-3'), { top: 152 }).scale(0.5);
    Materials.WATER.sprites[3] = new fabric.Image(document.getElementById('water-4'), { top: 122 }).scale(0.5);
    Materials.WOOD.sprites[0] = new fabric.Image(document.getElementById('wood'), { left: 25, top: 230 }).scale(0.5);
    Materials.WOOD.sprites[1] = new fabric.Image(document.getElementById('wood'), { left: 25, top: 200 }).scale(0.5);
    Materials.WOOD.sprites[2] = new fabric.Image(document.getElementById('wood'), { left: 25, top: 170 }).scale(0.5);
    Materials.WOOD.sprites[3] = new fabric.Image(document.getElementById('wood'), { left: 25, top: 140 }).scale(0.5);
    $('#preload').hide();

    // Initialize sliders.
    var temperatureSliderOptions = {
      id: 'temp-slider',
      formatter: function(value) {
        /* if (value > this.value[0])
          return "Final: " + value + "°C"; */
        return Environment.temperature.toPrecision(3) + "°C";
      },
      enabled: false,
      tooltip: "always",
      ticks: [0, Constants.ROOM_TEMP, Constants.FINAL_TEMP, 100],
      ticks_labels: ['0°C', 'Initial: ' + Constants.ROOM_TEMP + '°C', 'Final: ' + Constants.FINAL_TEMP + '°C', '100°C'],
      ticks_positions: [0, Constants.ROOM_TEMP, Constants.FINAL_TEMP, 100],
      value: Constants.ROOM_TEMP,
    };
    temperatureSlider = $("#temp").slider(temperatureSliderOptions);
    /* temperatureSlider.on("change", function(slideEvt) {
      var value = temperatureSlider.slider('getValue');
      if (value[0] != Environment.temperature) {
        value[0] = Environment.temperature;
      }
      if (value[1] < 40) {
        value[1] = 40;
      } else if (value[1] > 100) {
        value[1] = 100;
      }
      temperatureSlider.slider('setValue', value);
      Environment.temperature_final = value[1];
    }); */

    refresh();

    // Updates the title of a dropdown given one of its menu items.
    function updateDropdownText(menuitem, text) {
      $(menuitem).parents(".btn-group").find(".dropdown-toggle").html(text +
        " <span class=\"caret\"></span>");
    }

    $("#material-brick").click(function() {
      Environment.material = Materials.BRICK;
      updateDropdownText(this, "Brick");
      refresh();
    });

    $("#material-chocolate").click(function() {
      Environment.material = Materials.CHOCOLATE;
      updateDropdownText(this, "Chocolate");
      refresh();
    });

    $("#material-concrete").click(function() {
      Environment.material = Materials.CONCRETE;
      updateDropdownText(this, "Concrete");
      refresh();
    });

    $("#material-water").click(function() {
      Environment.material = Materials.WATER;
      updateDropdownText(this, "Water");
      refresh();
    });

    $("#material-wood").click(function() {
      Environment.material = Materials.WOOD;
      updateDropdownText(this, "Wood");
      refresh();
    });

    $('#mass-add').on('click', function() {
      Environment.n++;
      refresh();
    });

    $('#mass-remove').on('click', function() {
      Environment.n--;
      refresh();
    });

    $('#temperature-reset').on('click', function() {
      Environment.temperature = Constants.ROOM_TEMP;
      refresh();
    });

    function calculatedDerivedVariables() {
      Environment.current_result[4] = Environment.current_result[3] - Environment.current_result[2];
      if (Math.abs(Environment.current_result[4]) < Constants.EPSILON) {
        Environment.current_result[6] = 'N/A';
        Environment.current_result[7] = 'N/A';
      } else {
        Environment.current_result[6] = Environment.current_result[5] / Environment.current_result[4];
        Environment.current_result[7] = Environment.current_result[5] / Environment.current_result[1] / Environment.current_result[4];
      }
    }

    $('#energy-add').on('click', function() {
      Environment.temperature += Constants.ENERGY_STEP / (Environment.n * Constants.MASS_STEP) / Environment.material.c;
      if (Environment.recording) {
        Environment.current_result[3] = Environment.temperature;
        Environment.current_result[5] += Constants.ENERGY_STEP;
        calculatedDerivedVariables();
      }
      refresh();
      arrow_up.set('opacity', 1);
      arrow_up.set('top', 320);
      arrow_up.animate({
        'opacity': 0,
        top: 270
      }, {
        onChange: canvas.renderAll.bind(canvas)
      });
    });

    $('#energy-remove').on('click', function() {
      Environment.temperature -= Constants.ENERGY_STEP / (Environment.n * Constants.MASS_STEP) / Environment.material.c;
      if (Environment.recording) {
        Environment.current_result[3] = Environment.temperature;
        Environment.current_result[5] -= Constants.ENERGY_STEP;
        calculatedDerivedVariables();
      }
      refresh();
      arrow_down.set('opacity', 1);
      arrow_down.set('top', 270);
      arrow_down.animate({
        'opacity': 0,
        'top': 330
      }, {
        onChange: canvas.renderAll.bind(canvas)
      });
    });

    $('#recording-start').on('click', function() {
      Environment.current_result = [ Environment.material.name, Environment.n * Constants.MASS_STEP, Environment.temperature, Environment.temperature, 0, 0, 'N/A', 'N/A' ];
      Environment.results.push(Environment.current_result);
      Environment.recording = true;
      refresh();
    });

    $('#recording-stop').on('click', function() {
      Environment.recording = false;
      refresh();
    });

    $('#reset').on('click', function() {
      Environment.recording = false;
      Environment.current_result = null;
      Environment.results = [];
      refresh();
    });

    $('#brick100').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.BRICK;
      Environment.n = 1;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#brick100Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#brick200').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.BRICK;
      Environment.n = 2;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#brick200Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#concrete100').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.CONCRETE;
      Environment.n = 1;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#concrete100Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#concrete200').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.CONCRETE;
      Environment.n = 2;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#concrete200Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#water100').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.WATER;
      Environment.n = 1;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#water100Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#water200').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.WATER;
      Environment.n = 2;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#water200Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#wood100').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.WOOD;
      Environment.n = 1;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#wood100Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

    $('#wood200').on('click', function() {
      if (Environment.interval) clearInterval(Environment.interval);
      Environment.material = Materials.WOOD;
      Environment.n = 2;
      Environment.temperature = Constants.ROOM_TEMP;
      Environment.time = 0;
      Environment.interval = setInterval(handleTick, 100);
      callback = function() {
        $('#wood200Result').html(Environment.time + ' s').delay(100).fadeOut().fadeIn('slow');
      }
      refresh();
    });

  });

})();

