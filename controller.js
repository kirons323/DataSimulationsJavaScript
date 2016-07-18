'use strict';

var	path = require('path');
var fs = require('fs');
var sims = require('./simulations.js');

angular.module('DS_app', [])

    // Saves all input from index.html
    .controller('MainControl', ['$scope', function($scope) {
        $scope.simulatedData = [];
        // list of properties, temporary property info to be saved later
        $scope.myProperties = [ ];
        $scope.tempProp = {
            name: '',
            type: 'Number', // can be number or boolean
            min: 0, // if number
            max: 1, // if number
            initialValue: 0, // if number
            stepSize: 1, // if step number
            changeType: 'Random', // if number - Random, Step, or Advanced
            formula: 'Exponential', // which modelling formula
            t_start: 0,
            t_end: 0,
            for_A: 0,
            for_B: 0,
            timesteps: 0,
            trig: 'Sine',
            value: 'True', // if boolean
            variability: 'Static', // if boolean, Static or Variable
            sim_values: [],
            enabled: false,
            refreshRate: 5
        };
        $scope.orig_before_edit = {
            name: '',
            type: 'Number', // can be number or boolean
            min: 0, // if number
            max: 1, // if number
            initialValue: 0, // if number
            stepSize: 1, // if step number
            changeType: 'Random', // if number - Random, Step, or Advanced
            formula: 'Exponential', // which modelling formula
            t_start: 0,
            t_end: 0,
            for_A: 0,
            for_B: 0,
            timesteps: 0,
            trig: 'Sine',
            value: 'True', // if boolean
            variability: 'Static', // if boolean, Static or Variable
            enabled: false,
            refreshRate: 5
        };

        // file paths for saving/loading configs
        $scope.savePropsPath = '';
        $scope.loadPropsPath = '';
        $scope.saveSimDataPath = '';
        $scope.all_data = [];

        // keeps track of currently selected/editing properties and reasons for invalid fields
        $scope.currentlySelected = '';
        $scope.editting_index = -1;
        $scope.problems = '';

        // reset tempProp so that all fields are cleared once a property has been added
        $scope.resetTempProp = function() {
            $scope.tempProp = {
                name: '',
                type: 'Number', // can be number or boolean
                min: 0, // if number
                max: 1, // if number
                initialValue: 0, // if number
                stepSize: 1, // if step number
                changeType: 'Random', // if number - Random, Step, or Advanced
                formula: 'Exponential', // which modelling formula
                t_start: 0,
                t_end: 0,
                for_A: 0,
                for_B: 0,
                timesteps: 0,
                trig: 'Sine',
                value: 'True', // if boolean
                variability: 'Static', // if boolean, Static or Variable
                enabled: false,
                refreshRate: 5
            };
        };

        // Start data simulation for selected properties
        $scope.startSimulation = function() {
            sims.simulate_data($scope.myProperties);
        };

        // Stop simulation for all properties
        $scope.stopSimulation = function() {
            sims.stop_simulation();
        };

        // Uploads connection config JSON to fields in index.html based on user selected file
        // @TODO: error checks for if someone uploads a file with no CSV data
        $scope.uploadDataFile = function() {
            try {
                var selected_file = document.getElementById('data_file_chooser').files[0];
                var fr = new FileReader();
                fr.onload = function(e) {
                    var contents = e.target.result;
                    try {
                        var all_lines = contents.split(/\r\n|\n/);
                        var i;
                        for(i=0; i<all_lines.length; i++) {
                            var data = all_lines[i].split(',');
                            if(data.length == 1)
                                continue;
                            var dataValues = [];
                            var j;
                            for(j=2; j<data.length; j++)
                                dataValues.push(data[j]);
                            var dataObject = {
                                propName: data[0],
                                timeStep: parseInt(data[1]),
                                currentTime: 0,
                                values: dataValues
                            };
                            $scope.simulatedData.push(dataObject);
                        }
                    }
                    catch (err) {
                        alert('Unable to load connection config file. Please make sure you have selected a CSV file and try again.');
                    }
                };
                fr.readAsText(selected_file);
            }
            catch(err) {
                alert('Unable to load connection config file. Please make sure you have selected a CSV file and try again.');
            }
        };

        // This will run the simulated data provided in an input file.
        $scope.runData = function() {
            try {
                if($scope.simulatedData.length == 0) // no data to simulate
                    throw err;
                sims.inputtedDataSetup($scope.simulatedData);
            }
            catch(err) {
                alert('An error occurred. Please make sure you are connected and have uploaded a file.');
            }
        };

        // Sets the path so the user can select a file to save their simulated data to
        $scope.simDataSelected = function(ele) {
            var files = ele.files;
            $scope.saveSimDataPath = files[0].path;
        };

        // Saves data generated by simulation to a file.
        $scope.saveSimData = function() {
            var contents = '';
            for(var i=0; i<$scope.myProperties.length; i++) {
                contents += $scope.myProperties[i].name + ',' + $scope.myProperties[i].refreshRate;
                for(var j=0; j<$scope.myProperties[i].sim_values.length; j++) {
                    contents += ',' + $scope.myProperties[i].sim_values[j];
                }
                contents += '\n';
            }
            fs.writeFile($scope.saveSimDataPath, contents, function(err) {
                if(err)
                    alert('Something went wrong. Please check the file and try again.');
            })
        };


        /*
         Since the event doesn't fire normally when the file name is changed, this function
         will tell of the change and set the $scope variable.
         */
        $scope.fileNameSelected = function(ele) {
            var files = ele.files;
            $scope.savePropsPath = files[0].path;
        };

        // Saves the property data to a user-specified file.
        $scope.savePropertyData = function() {
            var contents = angular.toJson($scope.myProperties, true);
            fs.writeFile($scope.savePropsPath, contents, function (err) {
                if(err)
                    alert('Something went wrong. Please check the file and try again.');
            })
        };

        // Loads a property file path into $scope variable
        $scope.propFileLoading = function(ele) {
            var files = ele.files;
            $scope.loadPropsPath = files[0].path;
        };

        // Actually adds the properties to the array and thus the dropdown in the UI
        $scope.loadPropertyData = function() {
            fs.readFile($scope.loadPropsPath, 'utf8', function(err, contents) {
                try {
                    contents = contents.toString();
                    var result = JSON.parse(contents);
                    var i;
                    for (i = 0; i < result.length; i++) {
                        var loaded_prop = result[i];
                        loaded_prop.sim_values = [];
                        $scope.$apply(function () {
                            $scope.myProperties.push(loaded_prop);
                        });
                    }
                }
                catch (e) {
                    alert('Something went wrong. Please make sure you have selected a JSON file and try again.');
                }
            });
        };

        // Validation for inputs - make sure everything is defined and correct (i.e. refreshRate is a number)
        //@TODO: Checks for formula stuff.
        $scope.validateInputs = function() {
            $scope.problems = '';
            var error = false;
            //@ TODO: trim whitespace in case someone just puts in spaces
            if(angular.isUndefined($scope.tempProp.name) || ($scope.tempProp.name === '')) {
                $scope.problems += 'Name is not specified.\n';
                error = true;
            }
            if($scope.tempProp.type == 'Number') {
                if(isNaN($scope.tempProp.min) || angular.isUndefined($scope.tempProp.min) || ($scope.tempProp.min === '')
                    || ($scope.tempProp.min == null)) {
                    $scope.problems += 'Minimum is not a number.\n';
                    error = true;
                }
                if(isNaN($scope.tempProp.max) || angular.isUndefined($scope.tempProp.max) || ($scope.tempProp.max === '')
                    || ($scope.tempProp.max == null)) {
                    $scope.problems += 'Maximum is not a number.\n';
                    error = true;
                }
                if($scope.tempProp.max < $scope.tempProp.min) {
                    $scope.problems += 'Maximum is less than the minimum value.\n';
                    error = true;
                }
                if(angular.isUndefined($scope.tempProp.changeType) || ($scope.tempProp.changeType === '')) {
                    $scope.problems += 'Change type is not specified.\n';
                    error = true;
                }
                if(($scope.tempProp.changeType === 'Step') &&
                    (isNaN($scope.tempProp.stepSize) || angular.isUndefined($scope.tempProp.stepSize) || ($scope.tempProp.stepSize === ''))) {
                    $scope.problems += 'Step size is not specified.';
                    error = true;
                }
                if(($scope.tempProp.changeType === 'Advanced') && ($scope.tempProp.formula === '')) {
                    $scope.problems += 'Formula is not specified.';
                    error = true;
                }
            }
            else if($scope.tempProp.type == 'Boolean') {
                if(angular.isUndefined($scope.tempProp.value) || ($scope.tempProp.value === '')) {
                    $scope.problems += 'Value is not specified.\n';
                    error = true;
                }
                if(angular.isUndefined($scope.tempProp.variability) || ($scope.tempProp.variability === '')) {
                    $scope.problems += 'Variability is not specified.\n';
                    error = true;
                }
            }
            else if(angular.isUndefined($scope.tempProp.type) || ($scope.tempProp.type === '')) {
                $scope.problems += 'Type is not specified.\n';
                error = true;
            }
            if(isNaN($scope.tempProp.refreshRate) || angular.isUndefined($scope.tempProp.refreshRate) ||
                ($scope.tempProp.refreshRate === '') || ($scope.tempProp.refreshRate == null)) {
                $scope.problems += 'Refresh rate is not specified.\n';
                error = true;
            }
            return error;
        };

        // Adds a property to the array/dropdown menu in the UI
        $scope.addProperty = function() {
            if($scope.validateInputs() == true) {
                alert($scope.problems);
                return;
            }
            $scope.tempProp.sim_values = [];
            $scope.myProperties.push($scope.tempProp);
            $scope.resetTempProp();
        };

        // Deletes property from array, removes from dropdown. If there's an error, nothing is removed.
        $scope.deleteProperty = function() {
            var index = 0;
            var found = false;
            for(var i=0; i<$scope.myProperties.length; i++) {
                if($scope.myProperties[i].name == $scope.currentlySelected) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if(!found) // in case user clicks by accident or clicks blank space
                return;
            $scope.myProperties.splice(index, 1);
            $scope.resetTempProp();
        };

        // Edits property from array. If there's an error, nothing is changed.
        $scope.editProperty = function() {
            if($scope.editting_index != -1) // don't save old values
                $scope.myProperties[$scope.editting_index] = $scope.orig_before_edit;

            var index = 0;
            var found = false;
            for(var i=0; i<$scope.myProperties.length; i++) {
                if($scope.myProperties[i].name == $scope.currentlySelected) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if(!found) // in case user clicks by accident or clicks blank space
                return;
            $scope.editting_index = index;
            // Save original property values in case someone enters invalid data.
            $scope.orig_before_edit = {
                name: $scope.myProperties[$scope.editting_index].name,
                type: $scope.myProperties[$scope.editting_index].type,
                min: $scope.myProperties[$scope.editting_index].min,
                max: $scope.myProperties[$scope.editting_index].max,
                initialValue: $scope.myProperties[$scope.editting_index].initialValue,
                stepSize: $scope.myProperties[$scope.editting_index].stepSize,
                changeType: $scope.myProperties[$scope.editting_index].changeType,
                formula: $scope.myProperties[$scope.editting_index].formula,
                t_start: $scope.myProperties[$scope.editting_index].t_start,
                t_end: $scope.myProperties[$scope.editting_index].t_end,
                for_A: $scope.myProperties[$scope.editting_index].for_A,
                for_B: $scope.myProperties[$scope.editting_index].for_B,
                timesteps: $scope.myProperties[$scope.editting_index].timesteps,
                trig: $scope.orig_before_edit.trig,
                text: $scope.myProperties[$scope.editting_index].text,
                value: $scope.myProperties[$scope.editting_index].value,
                variability: $scope.myProperties[$scope.editting_index].variability,
                sim_values: $scope.myProperties[$scope.editting_index].sim_values,
                enabled: $scope.myProperties[$scope.editting_index].enabled,
                refreshRate: $scope.myProperties[$scope.editting_index].refreshRate
            };
            $scope.tempProp = $scope.myProperties[$scope.editting_index];
        };

        // Actually saves the edits. This must be clicked or else the changes won't actually save.
        $scope.saveEdits = function() {
            if($scope.validateInputs() == true) {
                alert($scope.problems + 'Reverting...');
                $scope.myProperties[$scope.editting_index] = $scope.orig_before_edit;
                // Need to reset tempProp like this or else multiple failures to save changes will actually stay
                $scope.tempProp = {
                    name: $scope.orig_before_edit.name,
                    type: $scope.orig_before_edit.type,
                    min: $scope.orig_before_edit.min,
                    max: $scope.orig_before_edit.max,
                    initialValue: $scope.orig_before_edit.initialValue,
                    stepSize: $scope.orig_before_edit.stepSize,
                    changeType: $scope.orig_before_edit.changeType,
                    formula: $scope.orig_before_edit.formula,
                    t_start: $scope.orig_before_edit.t_start,
                    t_end: $scope.orig_before_edit.t_end,
                    for_A: $scope.orig_before_edit.for_A,
                    for_B: $scope.orig_before_edit.for_B,
                    timesteps: $scope.orig_before_edit.timesteps,
                    trig: $scope.orig_before_edit.trig,
                    text: $scope.orig_before_edit.text,
                    value: $scope.orig_before_edit.value,
                    variability: $scope.orig_before_edit.variability,
                    sim_values: $scope.orig_before_edit.sim_values,
                    enabled: $scope.orig_before_edit.enabled,
                    refreshRate: $scope.orig_before_edit.refreshRate
                };
                return;
            }
            $scope.myProperties[$scope.editting_index] = $scope.tempProp;
            $scope.editting_index = -1;
        }

    }])
;
