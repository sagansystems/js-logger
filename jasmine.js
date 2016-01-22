require("babel-core/register")({
	  presets: ['es2015'] // required for 'import' 
});
var Jasmine = require('jasmine');

var jasmine = new Jasmine();

jasmine.loadConfigFile('spec/support/jasmine.json');
jasmine.configureDefaultReporter({
    showColors: false
});
jasmine.execute();