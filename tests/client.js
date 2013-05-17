var test = require('tap').test;
var Client = require('../');
var options = {nodes: [{host: '127.0.0.1', port: 8087}]};
var client = Client(options);

test('setClientId', function(t) {
  client.setClientId({ client_id: 'testrunner' }, function (err) {
    t.notOk(err, err && err.message);
    t.end();
  });
});

test('getClientId', function(t) {
  client.getClientId(function(err, clientId) {
    t.notOk(err, err && err.message);
    t.equal(clientId, 'testrunner');
    t.end();
  });
});

test('ping', function(t) {
  client.ping(function(err) {
    t.notOk(err, err && err.message);
    t.end();
  });
});

test('getServerInfo', function (t) {
  client.getServerInfo(function (err, reply) {
    t.notOk(err, err && err.message);
    t.type(reply.node, 'string');
    t.type(reply.server_version, 'string');
    t.end();
  });
});

test('put', function (t) {
  client.put({
    bucket: 'test',
    key: 'test',
    content: { value: '{"test":"data"}',
    content_type: 'application/json',
    indexes: [{ key: 'test_bin', value: 'test' }] } },
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.end();
    });
});

test('get', function (t) {
  client.get({ bucket: 'test', key: 'test' }, function (err, reply) {
    t.notOk(err, err && err.message);
    t.ok(Array.isArray(reply.content));
    t.equal(reply.content.length, 1);
    t.equal(reply.content[0].value, '{"test":"data"}');
    t.end();
  });
});

test('put with vector clock', function (t) {
  var options = { bucket: 'test', key: 'test-vclock', content: { value: '{"test":"data"}', content_type: 'application/json' }, return_body: true };
  client.put(options, function (err, reply) {
    t.notOk(err, err && err.message);
    var options = { bucket: 'test', key: 'test-vclock', content: { value: '{"test":"data"}', content_type: 'application/json' }, return_body: true };
    options.vclock = reply.vclock;
    client.put(options, function(reply) {
      t.notOk(err, err && err.message);
      t.end();
    });
  });
});

test('put with index', function(t) {
  var indexes = [{ key: 'key1_bin', value: 'value1' }, { key: 'key2_bin', value: 'value2' }];
  var options = { bucket: 'test', key: 'test-put-index', content: { value: '{"test":"data"}', content_type: 'application/json', indexes: indexes }, return_body: true };

  client.put(options, function(err, reply) {
    t.notOk(err, err && err.message);
    t.deepEqual(reply.content[0].indexes, indexes);
    t.end();
  });
});

test('put large object', function(t) {
  var value = {};
  for (var i = 0; i < 5000; i++) {
    value['test_key_' + i] = 'test_value_' + i;
  }

  client.put({
    bucket: 'test',
    key: 'large_test',
    content: { value: JSON.stringify(value), content_type: 'application/json' }},
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.end();
    });
});

test('get large', function(t) {
  var value = {};
  for (var i = 0; i < 5000; i++) {
    value['test_key_' + i] = 'test_value_' + i;
  }
  client.get({
    bucket: 'test',
    key: 'large_test' },
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.ok(Array.isArray(reply.content));
      t.equal(reply.content.length, 1);
      t.equal(reply.content[0].value, JSON.stringify(value));
      t.end();
    });

});

test('getIndex', function(t) {
  client.getIndex({
    bucket: 'test',
    index: 'test_bin',
    qtype: 0,
    key: 'test' },
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.ok(Array.isArray(reply.keys));
      t.equal(reply.keys[0], 'test');
      t.end();
    });
});

test('getBuckets', function(t) {
  client.getBuckets(function(err, buckets) {
    t.notOk(err, err && err.message);
    t.ok(Array.isArray(buckets));
    t.end();
  });
});

test('setBucket', function(t) {
  client.setBucket({
    bucket: 'test',
    props: { allow_mult: true, n_val: 3 } },
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.end();
    });
});

test('getBucket', function(t) {
  client.getBucket({ bucket: 'test' }, function (err, bucket) {
    t.notOk(err, err && err.message);
    t.strictEqual(bucket.n_val, 3);
    t.strictEqual(bucket.allow_mult, true);
    t.end();
  });
});

test('resetBucket', function(t) {
  client.setBucket({
    bucket: 'test',
    props: { allow_mult: false, n_val: 3 } },
    function (err, reply) {
      t.notOk(err, err && err.message);
      t.end();
    });
});

test('getKeys', function (t) {
  console.log('-------');
  client.getKeys({ bucket: 'test' }, function (err, reply) {
    t.notOk(err, err && err.message);
    t.ok(Array.isArray(reply.keys));
    t.end();
    return;
    var len = reply.keys.length;
    reply.keys = reply.keys.filter(function (key) {
      return (key.toString() === 'test' || key.toString() === 'large_test' || key.toString() === 'test-vclock' || key.toString() === 'test-put-index')
    });
    t.equal(reply.keys.length, len);
    t.equal(reply.done, true);
    t.end();
  });
});



exports.setBucket = function (test) {

};

test('disconnects', function(t) {
  client.disconnect();
  t.end();
});

return;






















exports.mapred = function (test) {
  var request = {
    inputs: [['test', 'test']],
    query: [
    {
      map: {
        source: 'function (v) { return [[v.bucket, v.key]]; }',
        language: 'javascript',
        keep: true
      }
    },
    {
      map: {
        name: 'Riak.mapValuesJson',
        language: 'javascript',
        keep: true
      }
    }
    ]
  };
  client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, function (reply) {
    test.equal(reply.errmsg, undefined);
    test.ok(Array.isArray(reply[0]));
    test.ok(Array.isArray(reply[0][0]));
    test.equal(reply[0][0][0], 'test');
    test.equal(reply[0][0][1], 'test');
    test.ok(Array.isArray(reply[1]));
    test.equal(typeof reply[1][0], 'object');
    test.equal(reply[1][0].test, 'data');
    test.equal(reply.done, true);
    test.done();
  });
};

exports.search = function (test) {
  client.search({ index: 'test', q: 'test:data' }, function (reply) {
    test.done();
  });
};

exports.del = function (test) {
  client.del({ bucket: 'test', key: 'test' }, function (reply) {
    test.equal(reply.errmsg, undefined);
    client.del({ bucket: 'test', key: 'large_test' }, function (reply) {
      test.equal(reply.errmsg, undefined);
      client.del({ bucket: 'test', key: 'test-vclock' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        client.del({ bucket: 'test', key: 'test-put-index' }, function (reply) {
          test.equal(reply.errmsg, undefined);
          test.done();
        });
      });
    });
  });
};
