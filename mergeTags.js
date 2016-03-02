// tags
'use strict';

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

function mergeTags(tags1, tags2) {
  return extend({}, tags1, tags2); 
}

module.exports = mergeTags;
