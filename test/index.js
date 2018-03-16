const test = require('tape').test ;
const XmlElement = require('..');
const parseString = require('xml2js').parseString;
const fs = require('fs-extra') ;
const debug = require('debug')('drachtio:presence-parser');

function promiseParseString(content) {
  return new Promise((resolve, reject) => {
    parseString(content, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
function parse(filename, ctype) {
  return fs.readFile(`${__dirname}/data/${filename}`, 'utf8')
    .then(promiseParseString)
    .then((obj) => {
      const tag = Object.keys(obj)[0];
      return new XmlElement(tag, obj[tag]);
    });
}

test.skip('parser: minimal', (t) => {
  parse('pidf_xml_basic.xml', 'application/pidf+xml')
    .then((xmlElement) => {
      console.log(xmlElement.tag);
      console.log(xmlElement.namespace);
      console.log(xmlElement.getChildren().map((c) => c.tag));
      console.log(xmlElement.getChildren('tuple').map((c) => c.tag));
      console.log(xmlElement.getChildren('dm:person').map((c) => c.tag));
      console.log(xmlElement.getChildren('person', 'urn:ietf:params:xml:ns:pidf:data-model').map((c) => c.tag));
      console.log(xmlElement.getChildren('dm:person')[0].attributes);
      console.log(xmlElement.getChildren('dm:person')[0].getAttribute('id'));
      console.log(xmlElement.getChildren('dm:person')[0].hasAttribute('does-not-exist'));
      console.log(xmlElement.getChildren('tuple')[0].getChildren('status')[0].getChildren('basic')[0].content);

      return t.end();
    })
    .catch((err) => {

    });
});

test('parser: minimal', (t) => {
  parse('pidf_xml_basic.xml', 'application/pidf+xml')
    .then((xmlElement) => {
      t.ok(xmlElement.getChildren('dm:person').length === 1, 'getChildren by name');
      t.ok(xmlElement.getChildren('person', 'urn:ietf:params:xml:ns:pidf:data-model').length === 1,
        'getChildren by name and urn');
      t.ok(xmlElement.getChildren('dm:person')[0].getChildren('dm:note').length === 1,
        'expected one dm:note child element of person');
      const note = xmlElement.getChildren('dm:person')[0].getChildren('dm:note')[0];
      t.ok(note.content === 'Busy', 'expected one dm:note with \'Busy\'');
      t.ok(xmlElement.getChildren('tuple').length === 1, 'expected one tuple element');
      const tuple = xmlElement.getChildren('tuple')[0];
      t.ok(tuple.getChildren('status').length === 1, 'expected one status element');
      const status = tuple.getChildren('status')[0];
      t.ok(status.getChildren('basic').length === 1, 'expected one status child \'basic\' element');
      const basic = status.getChildren('basic')[0];
      t.ok(basic.content === 'closed', 'expected status \'closed\'');
      return t.end();
    })
    .catch((err) => {
      console.error(err.stack);
      t.error(err);
    });
}) ;

test('parser: status extensions', (t) => {
  parse('pidf_xml_status_extensions.xml', 'application/pidf+xml')
    .then((xmlElement) => {
      t.ok(xmlElement.getChildren('tuple').length === 2, 'expected one tuple element');
      const tuple = xmlElement.getChildren('tuple')[0];
      t.ok(tuple.getChildren('status').length === 1, 'expected one status element');
      const status = tuple.getChildren('status')[0];
      debug(`status: ${JSON.stringify(status)}`);
      t.ok(status.getChildren('basic')[0].content === 'open', 'expected basic status of open');
      t.ok(status.getChildren('im', 'urn:ietf:params:xml:ns:pidf:im')[0].content === 'busy',
        'expected im status of busy');
      t.ok(tuple.getChildren('note').length === 2, 'expected two note elements');
      t.ok(tuple.getChildren('note', 'urn:ietf:params:xml:ns:pidf').length === 2,
        'getChildren with default urn/namespace works');
      const note = tuple.getChildren('note')[0];
      debug(`note: ${JSON.stringify(note)}`);
      t.equal(note.getAttribute('xml:lang'), 'en', 'expected english');
      t.equal(note.content, 'Don\'t Disturb Please!', 'got correct note text');

      return t.end();
    })
    .catch((err) => {
      console.error(err.stack);
      t.error(err);
    });
}) ;
