var math = require('mathjs');

var si_ids = [];

// Actually simulates the data
function randomStepSimulation(property) {
    if(property.type == 'Number') {
        var new_value;
        // RNG
        if(property.changeType == 'Random') {
            var max = parseInt(property.max);
            var min = parseInt(property.min);
            // This should result in an even distribution among the numbers.
            new_value = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // Min->Max, then Max->Min
        else if(property.changeType == 'Step') {
            // Default step size is 1
            if(property.stepSize == null) {
                property.stepSize = 1;
            }
            if(isNaN(property.value)) {
                if(property.initialValue != '')
                    new_value = parseInt(property.initialValue);
                else
                    new_value = parseInt(property.min);
                property.ascending = true;
            }
            else {
                var previous = property.value;
                if(previous == property.max) {
                    property.ascending = false;
                    new_value = previous - property.stepSize;
                }
                else if(previous == property.min) {
                    property.ascending = true;
                    new_value = previous + property.stepSize;
                }
                else if(property.ascending)
                    new_value = previous + property.stepSize;
                else if(!property.ascending)
                    new_value = previous - property.stepSize;
                // Keep within min/max bounds
                if(new_value > property.max)
                    new_value = property.max;
                if(new_value < property.min)
                    new_value = property.min;
            }
        }
        property.value = new_value;
        console.log(new_value);
        property.sim_values.push(new_value);
    }

    // RNG for variable values
    else if(property.type == 'Boolean') {
        var tf = Math.round(Math.random());
        if(tf == 0) {
            console.log('false');
            property.sim_values.push('false');
        }
        else {
            console.log('true');
            property.sim_values.push('true');
        }
    }
}

// Display simulated data from file
function simulateInputtedData(property) {
    if(property.currentTime < property.values.length) {
        if(property.type === 'Number')
            console.log(parseInt(property.values[property.currentTime]));
        else
            console.log(property.values[property.currentTime]);
        property.currentTime = property.currentTime + 1;
    }
}

// Advanced Data Simulation
/*
 @TODO: Error checks for overflow on large numbers (particularly with exponential) and nonexistent numbers.
 */
function advancedSimulation(property) {
    var timesteps = property.timesteps;
    var curr = property.currentTime;
    if(curr > timesteps)
        return;
    var new_value;
    var t_start = property.t_start;
    var t_end = property.t_end;
    // width of each timestep*number it's on + starting point is the current timestep
    var curr_t = ((t_end - t_start)/timesteps)*curr + t_start;
    var a_value = property.for_A;
    var b_value = property.for_B;

    if(property.formula === 'Polynomial') {
        new_value = 1;
    }
    else if(property.formula === 'Exponential') {
        new_value = a_value*(math.pow(math.e, b_value*curr_t));
    }
    else if(property.formula === 'Logarithmic') {
        new_value = a_value*(math.log(b_value*curr_t)); // default is natural log e
    }
    else if(property.formula === 'Trigonometric') {
        if(property.trig === 'Sine') {
            new_value = a_value*(math.sin(b_value*curr_t));
        }
        else if(property.trig === 'Cosine') {
            new_value = a_value*(math.cos(b_value*curr_t));
        }
        else if(property.trig === 'Tangent') {
            new_value = a_value*(math.tan(b_value*curr_t));
        }
    }
    console.log(new_value);
    property.currentTime += 1;
    property.sim_values.push(new_value);
}

// These functions are all called in tx_connect.js
module.exports = {
    // Sets up functions for data simulation
    simulate_data:
        function(all_properties) {
            var j;
            for(j=0; j<all_properties.length; j++) {
                var curr_id;
                if(all_properties[j].enabled == 'false')
                    continue;
                if((all_properties[j].type == 'Boolean') && (all_properties[j].variability == 'Static'))
                    continue;
                if((all_properties[j].type == 'Number') && (all_properties[j].changeType == 'Advanced')) {
                    all_properties[j].currentTime = 0;
                    advancedSimulation(all_properties[j]);
                    curr_id = setInterval(advancedSimulation, all_properties[j].refreshRate*1000, all_properties[j]);
                    si_ids.push(curr_id); // keep track so these functions can be stopped when the user stops the simulation
                    continue;
                }
                // Calls for the first time so that data actually changes when user starts simulating.
                randomStepSimulation(all_properties[j]);
                curr_id = setInterval(randomStepSimulation, all_properties[j].refreshRate*1000, all_properties[j]);
                si_ids.push(curr_id); // keep track so these functions can be stopped when the user stops the simulation
            }
        },

    // Get rid of all setIntervals
    stop_simulation:
        function() {
            var i;
            for(i=0; i<si_ids.length; i++)
                clearInterval(si_ids[i]);
            si_ids = [];
        },

    // Start running data from file
    inputtedDataSetup:
        function (data_simulations) {
            for (var i = 0; i < data_simulations.length; i++) {
                // set the first value initially
                if (data_simulations[i].values.length > 0) {
                    console.log(data_simulations[i].values[data_simulations[i].currentTime]);
                    data_simulations[i].currentTime = data_simulations[i].currentTime + 1;
                }
                var curr_id = setInterval(simulateInputtedData, data_simulations[i].timeStep * 1000, data_simulations[i]);
                si_ids.push(curr_id); // keep track so these functions can be stopped when the user stops the simulation
            }
        }
};
