module.exports = {
  snakeCaseToCamelCase: function(s) {
    if (!s)
      return s;

    var ret = s.replace(/_+[a-zA-Z0-9]/g, function(match, offset, string) {
      return match[match.length - 1].toUpperCase();
    });

    var ix = s.search(/[a-zA-Z0-9]/g);
    if (ix != -1) {
      ret = s[ix] + ret.substr(1);
    }

    ret = ret.replace(/_/g, '');

    return ret;
  },
};

/*var tester = module.exports.snakeCaseToCamelCase;
var tests = [
  '_____hello_there_ladies_and_1_gentleman_123haha__word___',
  '_____Hello_there_ladies_and_1_gentleman_123haha__word___',
  'basic_snake_case',
  'Capital_snake_case',
  '',
  'word',
];

for (var i = 0; i < tests.length; i++) {
  console.log(tester(tests[i]));
}*/
