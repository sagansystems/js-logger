'use strict';

var createLogger = require('../logger');
var mergeTags = require('../mergeTags');

describe('mergeTags', function() {
  var testTime;

  beforeEach(function() {
    testTime = new Date();
    jasmine.clock().install();
    jasmine.clock().mockDate(testTime);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it ('Merges 2 maps with tags correctly', function() {
    var map1 = {
      "k1": "v1",
      "k2": "v2"
    }
    var map2 = {
      "k3": "v3",
      "k4": "v4"
    }

    var merged = mergeTags(map1, map2)

    expect(Object.keys(merged).length).toEqual(4);
  })

  it ('Merges 1 map with tags and a null map correctly', function() {
    var map1 = {
      "k1": "v1",
      "k2": "v2"
    }
    var map2 = null;

    var merged = mergeTags(map1, map2)

    expect(Object.keys(merged).length).toEqual(2);
  })

  it ('Merges 2 null maps correctly', function() {
    var map1 = null;
    var map2 = null;

    var merged = mergeTags(map1, map2)

    expect(Object.keys(merged).length).toEqual(0);
  })
});
